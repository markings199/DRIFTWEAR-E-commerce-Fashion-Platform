// Utility functions for checkout
export const getApiBaseUrl = () => {
  // Use environment variable or fallback
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  
  if (envUrl) {
    return envUrl;
  }
  
  // Determine based on current host
  const host = window.location.hostname;
  
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:5000/api';
  } else {
    // For production
    return 'https://driftwear-backend.onrender.com/api';
  }
};

export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP'
  }).format(price);
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^(\+?63|0)?[9]\d{9}$/;
  return re.test(phone.replace(/\s/g, ''));
};