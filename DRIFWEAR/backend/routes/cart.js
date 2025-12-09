const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cartController');
const authenticateToken = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authenticateToken);

router.get('/', getCart);
router.post('/add', addToCart);
router.put('/:itemId', updateCartItem);
router.delete('/:itemId', removeFromCart);
router.delete('/', clearCart);

module.exports = router;