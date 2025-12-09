// routes/profile.js
const express = require('express');
const requireAuth = require('../middleware/auth');
const User = require('../models/User');
const router = express.Router();

// Get user profile
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.session.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching profile' });
  }
});

module.exports = router;