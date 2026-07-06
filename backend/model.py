try:
    import whisper
    # Load Whisper model once globally
    model = whisper.load_model("tiny")
except ImportError:
    print("WARNING: Whisper module not found. Audio transcription will be disabled.")
    model = None

def transcribe_audio(audio_path):
    """
    Transcribe speech to text using Whisper.
    Args:
        audio_path (str): Path to the audio file.
    Returns:
        str: Transcribed text.
    """
    if model is None:
        return "[Audio transcription is currently unavailable: Whisper not installed]"
    
    try:
        # Whisper auto-detects language if not specified
        result = model.transcribe(audio_path)
        return result["text"]
    except Exception as e:
        raise RuntimeError(f"Transcription failed: {str(e)}")

def analyze_text_with_openai(text, openai_api_key, language="English"):
    """
    Use OpenAI's GPT-4o-mini model to evaluate the transcription.
    Args:
        text (str): Transcribed speech.
        openai_api_key (str): API key for OpenAI.
        language (str): The language being assessed.
    Returns:
        str: Structured feedback from the LLM.
    """
    client = OpenAI(api_key=openai_api_key)

    prompt = f"""
    Evaluate the following speech transcription for proficiency in the {language} language:

    "{text}"

    Provide feedback on:
    - Pronunciation Accuracy (how well it sounds like a native speaker of {language})
    - Fluency and Coherence
    - Grammar and Sentence Structure (specifically for {language})
    - Overall Proficiency Score (0-10)
    - CEFR Proficiency Level (A1-C2)

    Format your response clearly with labels.
    """

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            top_p=1
        )
        return response.choices[0].message.content
    except Exception as e:
        raise RuntimeError(f"OpenAI evaluation failed: {str(e)}")

def save_uploaded_file(uploaded_file, save_path="temp_audio.wav"):
    """
    Save uploaded file to a temporary path.
    Args:
        uploaded_file: Uploaded file object.
        save_path (str): Destination path.
    """
    try:
        with open(save_path, "wb") as f:
            f.write(uploaded_file.read())
    except Exception as e:
        raise RuntimeError(f"Failed to save file: {str(e)}")

def delete_temp_file(file_path="temp_audio.wav"):
    """
    Delete a temporary audio file.
    Args:
        file_path (str): Path to the file to delete.
    """
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception as e:
        raise RuntimeError(f"Failed to delete file: {str(e)}")
