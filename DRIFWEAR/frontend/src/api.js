// src/api.js
export const API_URL = import.meta.env.VITE_API_BASE_URL;

export const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_URL}${endpoint}`;
  const defaultOptions = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  };

  const response = await fetch(url, defaultOptions);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API request failed with status ${response.status}`);
  }

  return response.json();
};
