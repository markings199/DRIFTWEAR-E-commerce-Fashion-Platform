// Auth helper functions
const API_BASE = '/api';

// Check if user is authenticated
function checkAuth() {
  return localStorage.getItem('token') !== null;
}

// Get current user
function getCurrentUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

// Login function
async function login(email, password) {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } else {
      const error = await response.json();
      return { success: false, error: error.message };
    }
  } catch (error) {
    return { success: false, error: 'Network error. Please try again.' };
  }
}

// Signup function
async function signup(username, email, password) {
  try {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, email, password })
    });
    
    if (response.ok) {
      const data = await response.json();
      return { success: true, message: data.message };
    } else {
      const error = await response.json();
      return { success: false, error: error.message };
    }
  } catch (error) {
    return { success: false, error: 'Network error. Please try again.' };
  }
}

// Logout function
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}

// Update user profile
async function updateProfile(userData) {
  try {
    const response = await fetch(`${API_BASE}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(userData)
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } else {
      const error = await response.json();
      return { success: false, error: error.message };
    }
  } catch (error) {
    return { success: false, error: 'Network error. Please try again.' };
  }
}