import requests
import os
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "http://localhost:8080"

def test_root():
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Root check: {response.json()}")
    except Exception as e:
        print(f"Root check failed: {e}")

def test_openai():
    try:
        payload = {"Question": "Hello", "response": "Hi there"}
        response = requests.post(f"{BASE_URL}/evaluate/", json=payload)
        print(f"OpenAI check: {response.json()}")
    except Exception as e:
        print(f"OpenAI check failed: {e}")

if __name__ == "__main__":
    print("--- Verifying Merged Backend ---")
    test_root()
    test_openai()
