import numpy as np
from dotenv import load_dotenv
import os
import uvicorn
import soundfile as sf
import cv2
import json
import time
import asyncio
import uuid
import threading
import traceback
import scipy.io.wavfile
import sounddevice as sd
from datetime import datetime
from typing import List, Dict, Optional
from fastapi import FastAPI, HTTPException, File, UploadFile, Form, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from io import BytesIO

# Import local utilities
from model import transcribe_audio, analyze_text_with_openai, delete_temp_file
from jsondata import transform_text_to_json
from similarity import text_similarity
from data_processing import process_and_transcribe, language
from face_object_proctoring import proctor_frame

# Load environment variables
load_dotenv()

# === FastAPI App ===
app = FastAPI(title="Verbiq Consolidated API", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Initialize OpenAI Client ===
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

print("================================")
print("OPENAI_API_KEY Loaded :", bool(OPENAI_API_KEY))
print("================================")

if not OPENAI_API_KEY:
    print("WARNING: OPENAI_API_KEY is not set in .env file. Evaluation features will be disabled.")
    client_openai = None
else:
    client_openai = OpenAI(api_key=OPENAI_API_KEY)

# === Constants & Global State ===
TARGET_CLASSES = {"person", "laptop", "cell phone", "tv", "book"}
threshold = 0.35
log_file = os.path.join("logs", "proctoring_log.jsonl")
screenshot_dir = "suspicious_frames"
os.makedirs(screenshot_dir, exist_ok=True)
os.makedirs("recordings", exist_ok=True)
os.makedirs("logs", exist_ok=True)
os.makedirs("data", exist_ok=True)

# Data file paths
USERS_FILE = os.path.join("data", "users.json")
CANDIDATES_FILE = os.path.join("data", "candidates.json")

# Initialize data files if they don't exist
if not os.path.exists(USERS_FILE):
    with open(USERS_FILE, "w") as f:
        json.dump([], f)

if not os.path.exists(CANDIDATES_FILE):
    with open(CANDIDATES_FILE, "w") as f:
        json.dump([], f)

# Audio processing constants
SAMPLE_RATE = 22050
DURATION = 1
CHUNK_SIZE = int(SAMPLE_RATE * DURATION)

RMS_THRESHOLD_BG = 0.05
RMS_THRESHOLD_WHISPER = 0.01
CENTROID_THRESHOLD_CAMERA = 3000
PITCH_THRESHOLD_WHISPER = 100
ZCR_THRESHOLD_KEYBOARD = 0.1

# Global variables for recording management
recording_sessions = {}

# === Pydantic Models ===
class TTSRequest(BaseModel):
    text: str
    voice: str = "af_heart"
    speed: float = 1
    split_pattern: str = "r\n+"

class TTSResponse(BaseModel):
    audio_files: List[str]

class EvaluationRequest(BaseModel):
    Question: str
    response: str

class AudioFeatures(BaseModel):
    rms: float
    centroid: float
    pitch: float
    zcr: float

class ClassificationResult(BaseModel):
    background_noise: bool
    whispering: bool
    camera_noise: bool
    keyboard_noise: bool
    normal_speech: bool
    timestamp: str
    features: Optional[AudioFeatures] = None

class RecordingSession(BaseModel):
    session_id: str
    status: str
    start_time: str
    duration: Optional[float] = None
    file_path: Optional[str] = None
    log_file_path: Optional[str] = None

class UserAuth(BaseModel):
    email: str
    password: str

class CandidateInfo(BaseModel):
    name: str
    middle_name: str
    surname: str
    contact: str
    mail: str
    language: str
    address: str

# === Audio Processing Helpers ===
def select_audio_device():
    try:
        devices = sd.query_devices()
        for i, device in enumerate(devices):
            if device['max_input_channels'] > 0 and 'mic' in device['name'].lower():
                sd.default.device = i
                return f"Selected: {device['name']}"
        return "Using default device."
    except Exception:
        return "Using default device."

def extract_features(audio):
    try:
        audio = audio.flatten()
        rms = np.sqrt(np.mean(audio ** 2))
        
        # Spectral Centroid
        fft = np.abs(np.fft.fft(audio))
        freqs = np.fft.fftfreq(len(fft), 1.0 / SAMPLE_RATE)
        positive_freqs = freqs[:len(freqs) // 2]
        positive_fft = fft[:len(fft) // 2]
        centroid = np.sum(positive_freqs * positive_fft) / np.sum(positive_fft) if np.sum(positive_fft) > 0 else 0

        # Pitch
        autocorr = np.correlate(audio, audio, mode='full')[len(audio)-1:]
        peaks = np.where((autocorr[1:-1] > autocorr[:-2]) & (autocorr[1:-1] > autocorr[2:]))[0]
        pitch = SAMPLE_RATE / peaks[0] if len(peaks) > 0 else 0

        # ZCR
        zcr = np.mean(np.abs(np.diff(np.sign(audio)))) / 2
        return rms, centroid, pitch, zcr
    except Exception:
        return 0, 0, 0, 0

def classify_audio(rms, centroid, pitch, zcr):
    result = {
        "background_noise": rms > RMS_THRESHOLD_BG,
        "camera_noise": centroid > CENTROID_THRESHOLD_CAMERA,
        "whispering": rms < RMS_THRESHOLD_WHISPER and pitch < PITCH_THRESHOLD_WHISPER,
        "keyboard_noise": zcr > ZCR_THRESHOLD_KEYBOARD and rms > RMS_THRESHOLD_WHISPER,
        "normal_speech": (RMS_THRESHOLD_WHISPER <= rms <= RMS_THRESHOLD_BG) and pitch >= PITCH_THRESHOLD_WHISPER,
        "timestamp": datetime.now().isoformat()
    }
    return result

async def record_audio_session(session_id: str):
    try:
        select_audio_device()
        session = recording_sessions[session_id]
        while session["status"] == "recording":
            audio = sd.rec(CHUNK_SIZE, samplerate=SAMPLE_RATE, channels=1, dtype='float32')
            sd.wait()
            if audio is not None and audio.size > 0:
                audio = audio.flatten()
                session["audio_chunks"].append(audio.copy())
                rms, centroid, pitch, zcr = extract_features(audio)
                classification = classify_audio(rms, centroid, pitch, zcr)
                result = ClassificationResult(**classification, features=AudioFeatures(rms=rms, centroid=centroid, pitch=pitch, zcr=zcr))
                session["results"].append(result.dict())
                
                # Log sensitive audio events
                if any([classification["whispering"], classification["keyboard_noise"], classification["camera_noise"]]):
                    log_entry = {
                        "timestamp": classification["timestamp"],
                        "type": "audio",
                        "events": [k for k, v in classification.items() if v and k != "timestamp" and k != "normal_speech"],
                        "rms": float(rms),
                        "pitch": float(pitch)
                    }
                    with open(log_file, "a") as f:
                        json.dump(log_entry, f)
                        f.write(",\n")
            await asyncio.sleep(0.1)
    except Exception as e:
        if session_id in recording_sessions:
            recording_sessions[session_id]["status"] = "error"

# === Endpoints ===

@app.get("/")
async def root():
    return {"message": "Verbiq Consolidated API is running!"}

# --- Authentication ---
@app.post("/signup")
async def signup(user: UserAuth):
    with open(USERS_FILE, "r") as f:
        users = json.load(f)
    
    if any(u["email"] == user.email for u in users):
        raise HTTPException(status_code=400, detail="User already exists")
    
    users.append(user.dict())
    with open(USERS_FILE, "w") as f:
        json.dump(users, f)
    
    return {"message": "User created successfully"}

@app.post("/login")
async def login(user: UserAuth):

    start = time.time()
    print("LOGIN START")

    with open(USERS_FILE, "r") as f:
        users = json.load(f)

    print(
        "JSON READ:",
        round(time.time() - start, 2),
        "seconds"
    )

    found_user = next(
        (
            u for u in users
            if u["email"] == user.email
            and u["password"] == user.password
        ),
        None
    )

    print(
        "LOGIN END:",
        round(time.time() - start, 2),
        "seconds"
    )

    if not found_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    return {"message": "Login successful"}

# --- Candidate Info ---
#@app.post("/save-candidate-info")
#async def save_candidate_info(info: CandidateInfo):
#    with open(CANDIDATES_FILE, "r") as f:
#        candidates = json.load(f)
#    
#    candidates.append(info.dict())
#    with open(CANDIDATES_FILE, "w") as f:
#        json.dump(candidates, f)
#    
#    return {"message": "Candidate information saved successfully"}

@app.post("/save-candidate-info")
async def save_candidate_info(info: CandidateInfo):

    import time

    start = time.time()

    print("SAVE START")

    with open(CANDIDATES_FILE, "r") as f:
        candidates = json.load(f)

    print(
        "AFTER READ:",
        round(time.time() - start, 3),
        "seconds"
    )

    candidates.append(info.dict())

    with open(CANDIDATES_FILE, "w") as f:
        json.dump(candidates, f)

    print(
        "AFTER WRITE:",
        round(time.time() - start, 3),
        "seconds"
    )

    return {
        "message":
        "Candidate information saved successfully"
    }

@app.get("/generate-questions/")
async def generate_questions(language: str = "English"):
    if not client_openai:
        raise HTTPException(
            status_code=500, 
            detail="OpenAI client not initialized. Check your API key."
            )
    
    prompt = f"""
    Generate a JSON set of assessment questions for a language learner in {language}.
    The questions MUST BE in this specific order:
    1. 5 Normal grammatical questions (mcq)
    2. 3 Read the paragraph questions (text_comprehension)
    3. 4 Listen and repeat (listen_repeat)
    4. 5 Fill in the blanks (fill_blanks)
    5. 1 Speak on given topic (speaking_topic)

    The questions should be structured as a list of objects exactly like this:
    [
      {{
        "id": 1,
        "type": "mcq",
        "question": "Grammar/vocabulary question in {language}.",
        "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
        "correct": 0
      }},
      {{
        "id": 2,
        "type": "text_comprehension",
        "paragraph": "A short paragraph in {language}.",
        "question": "A question based on the paragraph.",
        "placeholder": "Answer based on the paragraph...",
        "maxLength": 300
      }},
      {{
        "id": 3,
        "type": "listen_repeat",
        "text": "The sentence the candidate must hear and repeat.",
        "question": "Listen and repeat the sentence below.",
        "duration": 15
      }},
      {{
        "id": 4,
        "type": "fill_blanks",
        "question": "The ___ (sun/moon) is bright during the day.",
        "options": ["sun", "moon"],
        "correct": 0
      }},
      {{
        "id": 5,
        "type": "speaking_topic",
        "topic": "Describe your favorite hobby.",
        "question": "Speak about the topic provided.",
        "duration": 60
      }}
    ]
    Return ONLY the raw JSON array. No markdown formatting.
    """
    
    try:
        print("===========================")
        print("Generating Questions...")
        print("Language :", language)
        print("===========================")
        
        response = client_openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}]
        )
        content = response.choices[0].message.content.strip()
        
        print("=========================")
        print("OpenAI Response Received")
        print(content[:300])
        print("=========================")
        # Ensure we only have the JSON array part (openai sometimes adds markdown blocks)
        if content.startswith("```json"):
            content = content.split("```json")[1].split("```")[0].strip()
        elif content.startswith("```"):
            content = content.split("```")[1].split("```")[0].strip()
            
        questions_data = json.loads(content)
        return questions_data
    except Exception as e:
        print("========================")
        print("QUESTION GENERATION ERROR")
        traceback.print_exc()
        print("========================")
        
        raise HTTPException(status_code=500, detail=str(e))

# --- Assessment & Evaluation ---
@app.post("/evaluate/")
async def evaluate(request: EvaluationRequest):
    prompt = f"Evaluate the accuracy, clarity, and tone (1-10) of this summary for the content: {request.Question}\nSummary: {request.response}"
    try:
        response = client_openai.chat.completions.create(model="gpt-4o-mini", messages=[{"role": "user", "content": prompt}])
        return {"evaluation": response.choices[0].message.content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload_audio/")
async def upload_audio(file: UploadFile = File(...), language: str = Form("English")):
    try:
        audio_path = f"temp_{uuid.uuid4().hex}.wav"
        with open(audio_path, "wb") as f:
            f.write(file.file.read())
        transcription = transcribe_audio(audio_path)
        raw_analysis = analyze_text_with_openai(transcription, OPENAI_API_KEY, language)
        delete_temp_file(audio_path)
        return {"transcription": transcription, "language_assessment": raw_analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Proctoring ---
@app.post("/detect/")
async def detect_image(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return proctor_frame(img)

@app.post("/start-recording")
async def start_recording(background_tasks: BackgroundTasks):
    session_id = str(uuid.uuid4())
    start_time = datetime.now()
    log_file_path = os.path.join("logs", f"session_{session_id[:8]}.jsonl")
    recording_sessions[session_id] = {
        "session_id": session_id, "status": "recording", "start_time": start_time.isoformat(),
        "audio_chunks": [], "results": [], "log_file_path": log_file_path
    }
    background_tasks.add_task(record_audio_session, session_id)
    return RecordingSession(session_id=session_id, status="recording", start_time=start_time.isoformat(), log_file_path=log_file_path)

@app.post("/stop-recording/{session_id}")
async def stop_recording(session_id: str):
    if session_id not in recording_sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    session = recording_sessions[session_id]
    session["status"] = "stopped"
    if session["audio_chunks"]:
        audio = np.concatenate(session["audio_chunks"], axis=0)
        file_path = os.path.join("recordings", f"session_{session_id[:8]}.wav")
        scipy.io.wavfile.write(file_path, SAMPLE_RATE, audio)
        session["file_path"] = file_path
        session["duration"] = len(audio) / SAMPLE_RATE
    return session

@app.get("/proctoring-status/{session_id}")
async def get_proctoring_status(session_id: str):
    if session_id not in recording_sessions:
        # Fallback to general status if no audio session exists
        return {"status": "active", "audio_suspicion": False}
    
    session = recording_sessions[session_id]
    latest_results = session["results"][-10:] if session["results"] else []
    
    # Check for recent audio violations
    keyboard_count = sum(1 for r in latest_results if r.get("keyboard_noise"))
    whisper_count = sum(1 for r in latest_results if r.get("whispering"))
    camera_noise = any(r.get("camera_noise") for r in latest_results)
    
    suspicious = keyboard_count > 3 or whisper_count > 3 or camera_noise
    
    warning = ""
    if whisper_count > 3:
        warning = "Whispering or sensitive audio detected. Please remain silent."
    elif keyboard_count > 3:
        warning = "Excessive keyboard activity detected."
    elif camera_noise:
        warning = "Suspicious camera-related noise detected."

    return {
        "status": session["status"],
        "suspicious": suspicious,
        "warning": warning,
        "detail": {
            "keyboard": keyboard_count,
            "whisper": whisper_count,
            "camera_noise": camera_noise
        }
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "active_sessions": len([s for s in recording_sessions.values() if s["status"] == "recording"])}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
