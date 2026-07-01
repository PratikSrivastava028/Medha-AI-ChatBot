// API Configuration
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    // If running on localhost, point to local backend
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:4000';
    }
  }
  // Otherwise point to production backend
  return 'https://medha-ai-chatbot.onrender.com';
};

export const API_BASE_URL = getApiUrl();

export default API_BASE_URL;

