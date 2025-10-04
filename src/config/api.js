// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export const API_ENDPOINTS = {
  tournaments: `${API_BASE_URL}/tournaments`,
  news: `${API_BASE_URL}/news`,
  venues: `${API_BASE_URL}/venues`,
};

export default API_BASE_URL;
