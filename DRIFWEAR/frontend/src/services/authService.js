// src/services/authService.js

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class AuthService {
  // Login user - Connect to backend
  async login(email, password) {
    try {
      console.log('Attempting login to backend:', email);
      
      const response = await fetch(`${API_BASE}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include' // Important for cookies
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Invalid email or password');
      }

      // Backend sends user data in response
      const userData = data.user;
      
      // For App.js compatibility, create user object
      const appUser = {
        id: userData.id || `USR${Date.now()}`,
        name: userData.name || userData.username || 'User',
        email: userData.email,
        username: userData.username,
        createdAt: new Date().toISOString(),
        isAdmin: false
      };
      
      // Store user data in localStorage for frontend (App.js format)
      localStorage.setItem('driftwear_user', JSON.stringify(appUser));
      
      console.log('Login successful:', appUser);
      return appUser;
      
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  }

  // Register new user - Connect to backend
  async register(userData) {
    try {
      console.log('Attempting registration to backend:', userData);
      
      const response = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
          username: userData.email, // Use email as username
          email: userData.email,
          password: userData.password
        }),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // For App.js compatibility, create user object
      const newUser = {
        id: data.user?.id || `USR${Date.now()}`,
        name: userData.name,
        email: userData.email,
        username: data.user?.username || userData.email,
        createdAt: new Date().toISOString(),
        isAdmin: false
      };
      
      // Store current user without password
      localStorage.setItem('driftwear_user', JSON.stringify(newUser));
      
      // Also add to users list for App.js compatibility
      const users = JSON.parse(localStorage.getItem('driftwear_users') || '[]');
      const existingUser = users.find(u => u.email === newUser.email);
      
      if (!existingUser) {
        users.push({
          ...newUser,
          password: userData.password // Store for App.js compatibility
        });
        localStorage.setItem('driftwear_users', JSON.stringify(users));
      }
      
      console.log('Registration successful:', newUser);
      return newUser;
      
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Registration failed');
    }
  }

  // Get current logged-in user
  getCurrentUser() {
    try {
      // Check localStorage (App.js format)
      const userStr = localStorage.getItem('driftwear_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        console.log('Current user from localStorage:', user);
        return user;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Update user profile - Connect to backend
  async updateProfile(profileData) {
    try {
      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        throw new Error('No user logged in');
      }
      
      // Send update to backend
      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Profile update failed');
      }
      
      // Update local storage for App.js compatibility
      const updatedUser = { ...currentUser, ...profileData };
      localStorage.setItem('driftwear_user', JSON.stringify(updatedUser));
      
      console.log('Profile updated successfully:', updatedUser);
      return updatedUser;
      
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error(error.message || 'Profile update failed');
    }
  }

  // Logout user
  logout() {
    try {
      // Call backend logout
      fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      }).catch(err => console.log('Backend logout error:', err));
      
      // Clear local storage
      localStorage.removeItem('driftwear_user');
      console.log('User logged out');
      
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      // Check local storage first
      const user = this.getCurrentUser();
      if (!user) return false;
      
      // Verify with backend
      const response = await fetch(`${API_BASE}/auth/me`, {
        credentials: 'include'
      });
      
      return response.ok;
      
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  }
}

// Create service instance
const authService = new AuthService();
export { authService };