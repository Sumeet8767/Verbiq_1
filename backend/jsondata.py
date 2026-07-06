import re
import json

def transform_text_to_json(text):
    """Convert structured text into a JSON object."""
    json_data = {
        "evaluation_results": {
            "pronunciation_accuracy": extract_score(text, r"\*?Pronunciation Accuracy:\s*"),
            "fluency_and_coherence": extract_score(text, r"\*?Fluency and Coherence:\s*"),
            "grammar_and_structure": extract_score(text, r"\*?Grammar and Sentence Structure:\s*"),
            "overall_score": extract_score(text, r"\*?Overall Proficiency Score \(0-10\):\s*"),
            "proficiency_level": extract_section(text, r"\*?Proficiency Score \(A1-C2\):\s*", r"Overall,")
        },
        "recommendations": extract_recommendations(text, r"\*?Recommendations for Improvement:\s*")
    }
    return json_data

def extract_section(text, start_pattern, end_pattern):
    """Extract a section of text between two patterns."""
    match = re.search(fr"{start_pattern}([\s\S]*?){end_pattern}", text)
    return match.group(1).strip() if match else None

def extract_score(text, pattern):
    """Extract a numeric score from a given pattern."""
    match = re.search(fr"{pattern}(\d+(\.\d+)?)", text)
    return float(match.group(1)) if match else None

def extract_recommendations(text, pattern):
    """Extract recommendations as a list."""
    match = re.search(fr"{pattern}([\s\S]*)", text)
    if match:
        lines = match.group(1).split("\n")
        return [line.strip().lstrip("* ") for line in lines if line.strip().startswith("*")]
    return []

# Test with sample text
if __name__ == "__main__":
    sample_text = """Your sample assessment text here..."""
    result = transform_text_to_json(sample_text)
    print(json.dumps(result, indent=4))
