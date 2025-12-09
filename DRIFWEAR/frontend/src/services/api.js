// Base API configuration
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

const api = {
  async get(endpoint) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('API request failed');
    return response.json();
  },

  async post(endpoint, data) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('API request failed');
    return response.json();
  },

  async put(endpoint, data) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('API request failed');
    return response.json();
  },

  async delete(endpoint) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) throw new Error('API request failed');
    return response.json();
  }
};

export default api;
