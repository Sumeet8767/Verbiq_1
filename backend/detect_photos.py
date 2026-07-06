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

app = FastAPI(title="Audio Processing API", version="1.0.0")

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

RMS_THRESHOLD_BG = 0.05
RMS_THRESHOLD_WHISPER = 0.01
CENTROID_THRESHOLD_CAMERA = 3000
PITCH_THRESHOLD_WHISPER = 100
ZCR_THRESHOLD_KEYBOARD = 0.1

# Global variables for recording management
recording_sessions = {}
active_recordings = {}

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
    port = int(os.environ.get("PORT", 8086))
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
