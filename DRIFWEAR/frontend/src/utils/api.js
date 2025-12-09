// /frontend/src/utils/api.js
export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  
  if (envUrl) {
    return envUrl;
  }
  
  const host = window.location.hostname;
  
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:5000/api';
  } else {
    return 'https://driftwear-backend.onrender.com/api';
  }
};

// Helper function for making API calls
export const apiFetch = async (endpoint, options = {}) => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};