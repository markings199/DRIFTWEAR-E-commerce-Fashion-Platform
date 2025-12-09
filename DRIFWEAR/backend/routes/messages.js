const express = require('express');
const router = express.Router();
const {
  getMessages,
  getMessage,
  sendMessage,
  getUnreadCount
} = require('../controllers/messageController');
const authenticateToken = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticateToken);

router.get('/', getMessages);
router.get('/unread', getUnreadCount);
router.get('/:id', getMessage);
router.post('/', sendMessage);

module.exports = router;