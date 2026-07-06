# import librosa
# import noisereduce

# import  soundfile as sf
import os
import whisper

# from librosa.core.audio import __audioread_load

language = "en"
# def reduce_noise(audio_file):
#     audio,sr =librosa.load(audio_file,sr=None)
#     reduced_audio = noisereduce.reduce_noise(y= audio,sr = sr)
#     denoised_file = "denoised_audio.wav"
#     sf.write(denoised_file,reduced_audio,sr)
#     return denoised_file

def transcribe_with_whisper(audio_file):
    #Transcribe speech to text using whisper
    model = whisper.load_model("small")
    result = model.transcribe(audio_file,language="en")
    return result["text"]

def delete_temp_file(file_path):
    if os.path.exists(file_path):
        os.remove(file_path)
# def process_and_transcribe(audio_file,language):
#     # denoised_audio = reduce_noise(audio_file)
#     transcription = transcribe_with_whisper(audio_file)
#     return transcription

import whisper
import soundfile as sf
import tempfile
import os

def process_and_transcribe(audio_file: str, language: str = "en") -> str:
    try:
        # Load audio (could be raw bytes or path)
        audio_data, sr = sf.read(audio_file)

        # Write to a temporary .wav file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp:
            sf.write(temp.name, audio_data, sr)
            temp_path = temp.name

        # Load Whisper model and transcribe
        model = whisper.load_model("small")
        result = model.transcribe(temp_path, language=language)

        # Clean up
        os.remove(temp_path)

        return result["text"]

    except Exception as e:
        print("Error during transcription:", e)
        raise
