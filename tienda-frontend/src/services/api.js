import axios from 'axios';

const resolveBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location) {
    const origin = window.location.origin;
    if (origin.includes('localhost')) {
      return 'http://localhost:3000/api';
    }
    return `${origin}/api`;
  }
  return '/api';
};

const api = axios.create({
  baseURL: resolveBaseUrl(),
  withCredentials: true
});

export default api;
