from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.cors import CORSMiddleware
from face_object_proctoring import proctor_frame
import numpy as np
import cv2
import os
import sounddevice as sd
import json
import time
from datetime import datetime
import scipy.io.wavfile
import asyncio
from typing import Dict, List, Optional
import threading
import uuid
from pydantic import BaseModel
import io

app = FastAPI(title="Proctoring Processing API", version="1.0.0")

# Add CORS middleware to allow Streamlit to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your Streamlit app's URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Audio processing constants
SAMPLE_RATE = 22050
DURATION = 1
CHUNK_SIZE = int(SAMPLE_RATE * DURATION)

RMS_THRESHOLD_BG = 0.04
RMS_THRESHOLD_WHISPER = 0.008
CENTROID_THRESHOLD_CAMERA = 2500
PITCH_THRESHOLD_WHISPER = 120
ZCR_THRESHOLD_KEYBOARD = 0.08

# Global variables for recording management
recording_sessions = {}
active_recordings = {}


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


def select_audio_device():
    """Select the default input device dynamically."""
    try:
        devices = sd.query_devices()
        for i, device in enumerate(devices):
            if device['max_input_channels'] > 0 and 'mic' in device['name'].lower():
                sd.default.device = i
                return f"Selected input device: {device['name']} (index {i})"
        return "No suitable microphone found. Using default device."
    except Exception as e:
        return f"Error selecting audio device: {str(e)}. Using default device."


def compute_spectral_centroid(audio, sr):
    """Manually compute spectral centroid using numpy FFT."""
    fft = np.abs(np.fft.fft(audio))
    freqs = np.fft.fftfreq(len(fft), 1.0 / sr)

    positive_freqs = freqs[:len(freqs) // 2]
    positive_fft = fft[:len(fft) // 2]

    if np.sum(positive_fft) == 0:
        return 0
    centroid = np.sum(positive_freqs * positive_fft) / np.sum(positive_fft)
    return centroid


def extract_features(audio):
    """Extract audio features: RMS, spectral centroid, pitch, and zero-crossing rate."""
    try:
        if not isinstance(audio, np.ndarray) or audio.size == 0:
            raise ValueError("Invalid audio input: must be a non-empty NumPy array")

        audio = audio.flatten()

        # RMS
        rms = np.sqrt(np.mean(audio ** 2))

        # Spectral centroid
        centroid = compute_spectral_centroid(audio, SAMPLE_RATE)

        # Pitch estimation using autocorrelation
        def autocorr(x):
            result = np.correlate(x, x, mode='full')
            return result[len(result) // 2:]

        autocorr_vals = autocorr(audio)
        peaks = np.where((autocorr_vals[1:-1] > autocorr_vals[:-2]) & (autocorr_vals[1:-1] > autocorr_vals[2:]))[0]
        pitch = SAMPLE_RATE / peaks[0] if len(peaks) > 0 else 0

        # Zero-crossing rate
        zcr = np.mean(np.abs(np.diff(np.sign(audio)))) / 2

        return rms, centroid, pitch, zcr
    except Exception as e:
        print(f"Error in extract_features: {str(e)}")
        return 0, 0, 0, 0


def classify_audio(rms, centroid, pitch, zcr):
    """Classify audio based on features."""
    result = {
        "background_noise": False,
        "whispering": False,
        "camera_noise": False,
        "keyboard_noise": False,
        "normal_speech": False,
        "timestamp": datetime.now().isoformat()
    }

    try:
        if rms > RMS_THRESHOLD_BG:
            result["background_noise"] = True

        if centroid > CENTROID_THRESHOLD_CAMERA:
            result["camera_noise"] = True

        if rms < RMS_THRESHOLD_WHISPER and pitch < PITCH_THRESHOLD_WHISPER:
            result["whispering"] = True

        if zcr > ZCR_THRESHOLD_KEYBOARD and rms > RMS_THRESHOLD_WHISPER:
            result["keyboard_noise"] = True

        if (RMS_THRESHOLD_WHISPER <= rms <= RMS_THRESHOLD_BG) and pitch >= PITCH_THRESHOLD_WHISPER:
            result["normal_speech"] = True
    except Exception as e:
        print(f"Error in classify_audio: {str(e)}")

    return result


def write_log_entry(log_file_path: str, session_id: str, result: ClassificationResult):
    """Write a single log entry to the session's log file."""
    try:
        log_entry = {
            "session_id": session_id,
            "timestamp": result.timestamp,
            "classification": {
                "background_noise": result.background_noise,
                "whispering": result.whispering,
                "camera_noise": result.camera_noise,
                "keyboard_noise": result.keyboard_noise,
                "normal_speech": result.normal_speech
            },
            "features": {
                "rms": result.features.rms,
                "centroid": result.features.centroid,
                "pitch": result.features.pitch,
                "zcr": result.features.zcr
            } if result.features else None
        }

        with open(log_file_path, "a") as log_file:
            log_file.write(json.dumps(log_entry) + "\n")

    except Exception as e:
        print(f"Error writing log entry: {str(e)}")


async def record_audio_session(session_id: str):
    """Background task to record audio for a session with real-time logging."""
    try:
        select_audio_device()
        session = recording_sessions[session_id]
        log_file_path = session["log_file_path"]

        # Initialize the log file with session metadata
        session_metadata = {
            "session_start": session["start_time"],
            "session_id": session_id,
            "sample_rate": SAMPLE_RATE,
            "chunk_duration": DURATION,
            "thresholds": {
                "rms_background": RMS_THRESHOLD_BG,
                "rms_whisper": RMS_THRESHOLD_WHISPER,
                "centroid_camera": CENTROID_THRESHOLD_CAMERA,
                "pitch_whisper": PITCH_THRESHOLD_WHISPER,
                "zcr_keyboard": ZCR_THRESHOLD_KEYBOARD
            }
        }

        with open(log_file_path, "w") as log_file:
            log_file.write(json.dumps(session_metadata) + "\n")
            log_file.write("--- AUDIO CLASSIFICATION RESULTS ---\n")

        chunk_counter = 0
        while session["status"] == "recording":
            try:
                audio = sd.rec(CHUNK_SIZE, samplerate=SAMPLE_RATE, channels=1, dtype='float32')
                sd.wait()

                if audio is not None and audio.size > 0:
                    audio = audio.flatten()
                    session["audio_chunks"].append(audio.copy())
                    chunk_counter += 1

                    # Extract features and classify
                    rms, centroid, pitch, zcr = extract_features(audio)
                    classification = classify_audio(rms, centroid, pitch, zcr)

                    result = ClassificationResult(
                        **classification,
                        features=AudioFeatures(rms=rms, centroid=centroid, pitch=pitch, zcr=zcr)
                    )

                    session["results"].append(result.dict())

                    # Write to session-specific log file
                    write_log_entry(log_file_path, session_id, result)

                    # Optional: Print real-time status
                    if chunk_counter % 10 == 0:  # Every 10 chunks
                        print(f"Session {session_id[:8]}: Processed {chunk_counter} chunks")

                await asyncio.sleep(0.1)

            except Exception as e:
                print(f"Error in recording session {session_id}: {str(e)}")
                break

    except Exception as e:
        print(f"Error in record_audio_session: {str(e)}")
        if session_id in recording_sessions:
            recording_sessions[session_id]["status"] = "error"


@app.post("/start-recording")
async def start_recording(background_tasks: BackgroundTasks):
    """Start a new recording session with dedicated log file."""
    session_id = str(uuid.uuid4())
    start_time = datetime.now()
    timestamp = start_time.strftime('%Y%m%d_%H%M%S')

    # Create unique filenames for this session
    base_filename = f"session_{timestamp}_{session_id[:8]}"
    log_filename = f"{base_filename}.jsonl"

    # Ensure logs directory exists
    os.makedirs("logs", exist_ok=True)
    log_file_path = os.path.join("logs", log_filename)

    recording_sessions[session_id] = {
        "session_id": session_id,
        "status": "recording",
        "start_time": start_time.isoformat(),
        "audio_chunks": [],
        "results": [],
        "log_file_path": log_file_path,
        "base_filename": base_filename
    }

    # Start background recording task
    background_tasks.add_task(record_audio_session, session_id)

    return RecordingSession(
        session_id=session_id,
        status="recording",
        start_time=start_time.isoformat(),
        log_file_path=log_file_path
    )


@app.post("/stop-recording/{session_id}")
async def stop_recording(session_id: str):
    """Stop a recording session, save audio and finalize log file."""
    if session_id not in recording_sessions:
        raise HTTPException(status_code=404, detail="Recording session not found")

    session = recording_sessions[session_id]
    session["status"] = "stopped"

    try:
        # Save the recorded audio
        if session["audio_chunks"]:
            audio = np.concatenate(session["audio_chunks"], axis=0)
            wav_filename = f"{session['base_filename']}.wav"

            # Ensure audio files directory exists
            os.makedirs("recordings", exist_ok=True)
            wav_file_path = os.path.join("recordings", wav_filename)

            # Write audio to WAV
            scipy.io.wavfile.write(wav_file_path, SAMPLE_RATE, audio)
            session["file_path"] = wav_file_path
            session["duration"] = len(audio) / SAMPLE_RATE

            # Write session summary to log file
            session_summary = {
                "session_end": datetime.now().isoformat(),
                "total_duration": session["duration"],
                "total_chunks": len(session["audio_chunks"]),
                "audio_file": wav_file_path,
                "total_classifications": len(session["results"])
            }

            with open(session["log_file_path"], "a") as log_file:
                log_file.write("--- SESSION SUMMARY ---\n")
                log_file.write(json.dumps(session_summary) + "\n")

        return {
            "session_id": session_id,
            "status": "completed",
            "start_time": session["start_time"],
            "duration": session.get("duration"),
            "file_path": session.get("file_path"),
            "log_file_path": session["log_file_path"],
            "total_chunks": len(session.get("audio_chunks", [])),
            "total_results": len(session.get("results", []))
        }

    except Exception as e:
        print(f"Error stopping recording: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error stopping recording: {str(e)}")


@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "Audio Processing API",
        "version": "1.0.0",
        "endpoints": {
            "/devices": "Get available audio devices",
            "/analyze-file": "Analyze uploaded audio file",
            "/start-recording": "Start real-time recording session",
            "/stop-recording/{session_id}": "Stop recording session",
            "/recording-status/{session_id}": "Get recording session status",
            "/download/{filename}": "Download recorded file",
            "/download-log/{session_id}": "Download session log file",
            "/real-time-chunk": "Process real-time audio chunk",
            "/logs": "Get detection logs",
            "/health": "Health check"
        }
    }


@app.get("/devices")
async def get_audio_devices():
    """Get available audio input devices."""
    try:
        devices = sd.query_devices()
        input_devices = []
        for i, device in enumerate(devices):
            if device['max_input_channels'] > 0:
                input_devices.append({
                    "index": i,
                    "name": device['name'],
                    "channels": device['max_input_channels'],
                    "sample_rate": device['default_samplerate']
                })
        return {"devices": input_devices, "selected": select_audio_device()}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting devices: {str(e)}")


@app.get("/recording-status/{session_id}")
async def get_recording_status(session_id: str):
    """Get the status of a recording session."""
    if session_id not in recording_sessions:
        raise HTTPException(status_code=404, detail="Recording session not found")

    session = recording_sessions[session_id]

    return {
        "session_id": session_id,
        "status": session["status"],
        "start_time": session["start_time"],
        "duration": session.get("duration"),
        "file_path": session.get("file_path"),
        "log_file_path": session.get("log_file_path"),
        "total_chunks": len(session.get("audio_chunks", [])),
        "total_results": len(session.get("results", [])),
        "latest_results": session.get("results", [])[-5:]  # Last 5 results
    }


@app.get("/download/{filename}")
async def download_file(filename: str):
    """Download a recorded audio file."""
    file_path = os.path.join("recordings", filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type='audio/wav'
    )


@app.get("/download-log/{session_id}")
async def download_log_file(session_id: str):
    """Download the log file for a specific session."""
    if session_id not in recording_sessions:
        raise HTTPException(status_code=404, detail="Recording session not found")

    session = recording_sessions[session_id]
    log_file_path = session.get("log_file_path")

    if not log_file_path or not os.path.exists(log_file_path):
        raise HTTPException(status_code=404, detail="Log file not found")

    filename = os.path.basename(log_file_path)
    return FileResponse(
        path=log_file_path,
        filename=filename,
        media_type='application/json'
    )


@app.post("/analyze-file")
async def analyze_audio_file(file: UploadFile = File(...)):
    """Analyze uploaded audio file."""
    try:
        # Read the uploaded file
        contents = await file.read()

        # Save temporarily
        temp_filename = f"temp_{uuid.uuid4().hex}.wav"
        with open(temp_filename, "wb") as f:
            f.write(contents)

        try:
            # Read and process the audio file
            sample_rate, audio = scipy.io.wavfile.read(temp_filename)

            if sample_rate != SAMPLE_RATE:
                print(f"Warning: Audio sample rate ({sample_rate}) differs from expected ({SAMPLE_RATE})")

            # Normalize audio
            if audio.dtype != np.float32:
                audio = audio.astype(np.float32)
                if np.max(np.abs(audio)) > 0:
                    audio = audio / np.max(np.abs(audio))

            results = []
            chunk_size = CHUNK_SIZE

            for i in range(0, len(audio), chunk_size):
                chunk = audio[i:i + chunk_size]
                if len(chunk) < chunk_size:
                    chunk = np.pad(chunk, (0, chunk_size - len(chunk)), mode='constant')

                rms, centroid, pitch, zcr = extract_features(chunk)
                classification = classify_audio(rms, centroid, pitch, zcr)

                result = ClassificationResult(
                    **classification,
                    features=AudioFeatures(rms=rms, centroid=centroid, pitch=pitch, zcr=zcr)
                )
                results.append(result.dict())

            return {
                "filename": file.filename,
                "total_chunks": len(results),
                "sample_rate": sample_rate,
                "results": results
            }

        finally:
            # Clean up temp file
            if os.path.exists(temp_filename):
                os.remove(temp_filename)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing file: {str(e)}")


@app.post("/real-time-chunk")
async def process_real_time_chunk(file: UploadFile = File(...)):
    """Process a single audio chunk in real-time."""
    try:
        contents = await file.read()

        # Convert bytes to numpy array
        audio_data = np.frombuffer(contents, dtype=np.float32)

        if len(audio_data) == 0:
            raise ValueError("Empty audio data")

        # Extract features and classify
        rms, centroid, pitch, zcr = extract_features(audio_data)
        classification = classify_audio(rms, centroid, pitch, zcr)

        result = ClassificationResult(
            **classification,
            features=AudioFeatures(rms=rms, centroid=centroid, pitch=pitch, zcr=zcr)
        )

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing audio chunk: {str(e)}")


@app.get("/logs")
async def get_logs(limit: int = 100):
    """Get recent detection logs from all sessions."""
    try:
        all_logs = []
        logs_dir = "logs"

        if os.path.exists(logs_dir):
            for filename in os.listdir(logs_dir):
                if filename.endswith('.jsonl'):
                    file_path = os.path.join(logs_dir, filename)
                    with open(file_path, "r") as f:
                        for line in f:
                            line = line.strip()
                            if line and not line.startswith("---"):
                                try:
                                    log_entry = json.loads(line)
                                    if "classification" in log_entry:  # Skip metadata entries
                                        all_logs.append(log_entry)
                                except json.JSONDecodeError:
                                    continue

        # Sort by timestamp and return most recent
        all_logs.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
        return {"logs": all_logs[:limit]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading logs: {str(e)}")


@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """Delete a recording session and its associated files."""
    if session_id not in recording_sessions:
        raise HTTPException(status_code=404, detail="Recording session not found")

    session = recording_sessions[session_id]

    # Delete the audio file if it exists
    if "file_path" in session and os.path.exists(session["file_path"]):
        try:
            os.remove(session["file_path"])
        except Exception as e:
            print(f"Error deleting audio file {session['file_path']}: {str(e)}")

    # Delete the log file if it exists
    if "log_file_path" in session and os.path.exists(session["log_file_path"]):
        try:
            os.remove(session["log_file_path"])
        except Exception as e:
            print(f"Error deleting log file {session['log_file_path']}: {str(e)}")

    # Remove the session
    del recording_sessions[session_id]

    return {"message": f"Session {session_id} and associated files deleted successfully"}


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "active_sessions": len([s for s in recording_sessions.values() if s["status"] == "recording"]),
        "total_sessions": len(recording_sessions)
    }


""" video proctoring """
@app.post("/detect/")
async def process_image(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    result = proctor_frame(img)
    return result

import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8081))
    uvicorn.run("proctoring_controller:app", host="0.0.0.0", port=port, reload=True)

# from fastapi import FastAPI, UploadFile, File
# from fastapi.middleware.cors import CORSMiddleware
# from face_object_proctoring import detect_frame
# import numpy as np
# import cv2
# import os
#
# app = FastAPI()
#
# # Enable CORS for frontend
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # Restrict in production
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )
#
# @app.post("/detect/")
# async def detect_image(file: UploadFile = File(...)):
#     contents = await file.read()
#     nparr = np.frombuffer(contents, np.uint8)
#     img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
#
#     result = detect_frame(img)
#
#     return result
#
# import uvicorn
#
# # === Entry point ===
# if __name__ == "__main__":
#     port = int(os.environ.get("PORT", 8089))
#     uvicorn.run("api_main:app", host="192.168.1.17", port=port, reload=True)
#
