const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getCurrentUser,
  updateProfile
} = require('../controllers/authController');
const authenticateToken = require('../middleware/authMiddleware');

// Public routes
router.post('/signup', register);
router.post('/signin', login);

// Protected routes
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getCurrentUser);
router.put('/profile', authenticateToken, updateProfile);

module.exports = router;