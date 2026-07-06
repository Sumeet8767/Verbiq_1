const ASSESSMENT_BASE_URL = 'http://localhost:8080';
const PROCTORING_BASE_URL = 'http://localhost:8080';

export const assessmentApi = {
  generateAudio: async (text) => {
    const response = await fetch(`${ASSESSMENT_BASE_URL}/generate_audio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return response.json();
  },

  evaluateResponse: async (question, responseText) => {
    const response = await fetch(`${ASSESSMENT_BASE_URL}/evaluate/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Question: question, response: responseText }),
    });
    return response.json();
  },

  uploadAudio: async (audioBlob, language) => {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.wav');
    formData.append('language', language);
    const response = await fetch(`${ASSESSMENT_BASE_URL}/upload_audio/`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  },

  generateQuestions: async (language) => {
    const response = await fetch(
      `${ASSESSMENT_BASE_URL}/generate-questions/?language=${language}`
    );

    if (!response.ok) {

      const text = await response.text();

      throw new Error(
        `Generate Questions Failed (${response.status})\n${text}`
      );
    }
    return await response.json();
    
  },
};

export const proctoringApi = {
  detectFrame: async (videoFrameBlob) => {
    const formData = new FormData();
    formData.append('file', videoFrameBlob, 'frame.jpg');
    const response = await fetch(`${PROCTORING_BASE_URL}/detect/`, {
      method: 'POST',
      body: formData,
    });
    return response.json();
  },

  startRecording: async () => {
    const response = await fetch(`${PROCTORING_BASE_URL}/start-recording`, {
      method: 'POST',
    });
    return response.json();
  },

  stopRecording: async (sessionId) => {
    const response = await fetch(`${PROCTORING_BASE_URL}/stop-recording/${sessionId}`, {
      method: 'POST',
    });
    return response.json();
  },
  
  getStatus: async (sessionId) => {
    const response = await fetch(`${PROCTORING_BASE_URL}/proctoring-status/${sessionId}`);
    return response.json();
  },
};
