// API Configuration
// Dynamically detect local vs production environment
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:4000';
    }
  }
  return 'https://medha-ai-chat-bot-sp2m.vercel.app';
};

export const API_BASE_URL = import.meta.env.VITE_API_URL || getApiUrl();

export default API_BASE_URL;
