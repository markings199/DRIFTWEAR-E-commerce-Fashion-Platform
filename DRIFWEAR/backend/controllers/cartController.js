const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Get user's cart
const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    
    if (!cart) {
      // Create a new cart if one doesn't exist
      cart = new Cart({ user: req.user._id, items: [] });
      await cart.save();
    }
    
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching cart' });
  }
};

// Add item to cart
const addToCart = async (req, res) => {
  try {
    const { productId, quantity, size, color } = req.body;
    
    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Check if product is in stock
    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Not enough stock available' });
    }
    
    let cart = await Cart.findOne({ user: req.user._id });
    
    // Create cart if it doesn't exist
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }
    
    // Check if product is already in cart
    const existingItemIndex = cart.items.findIndex(
      item => item.product.toString() === productId && item.size === size && item.color === color
    );
    
    if (existingItemIndex > -1) {
      // Update quantity if product already in cart
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      // Add new item to cart
      cart.items.push({
        product: productId,
        quantity,
        size,
        color
      });
    }
    
    // Calculate total
    cart.total = cart.items.reduce((total, item) => {
      return total + (item.quantity * product.price);
    }, 0);
    
    cart.updatedAt = new Date();
    await cart.save();
    
    // Populate product details before sending response
    await cart.populate('items.product');
    
    res.json({ message: 'Product added to cart', cart });
  } catch (error) {
    res.status(500).json({ error: 'Error adding to cart' });
  }
};

// Update cart item quantity
const updateCartItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    
    const cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }
    
    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }
    
    // Check if product is in stock
    const product = await Product.findById(item.product);
    if (product.stock < quantity) {
      return res.status(400).json({ error: 'Not enough stock available' });
    }
    
    item.quantity = quantity;
    
    // Calculate total
    cart.total = cart.items.reduce((total, item) => {
      return total + (item.quantity * product.price);
    }, 0);
    
    cart.updatedAt = new Date();
    await cart.save();
    
    await cart.populate('items.product');
    res.json({ message: 'Cart updated', cart });
  } catch (error) {
    res.status(500).json({ error: 'Error updating cart' });
  }
};

// Remove item from cart
const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }
    
    cart.items.pull(itemId);
    
    // Recalculate total
    if (cart.items.length > 0) {
      await cart.populate('items.product');
      cart.total = cart.items.reduce((total, item) => {
        return total + (item.quantity * item.product.price);
      }, 0);
    } else {
      cart.total = 0;
    }
    
    cart.updatedAt = new Date();
    await cart.save();
    
    res.json({ message: 'Item removed from cart', cart });
  } catch (error) {
    res.status(500).json({ error: 'Error removing from cart' });
  }
};

// Clear cart
const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }
    
    cart.items = [];
    cart.total = 0;
    cart.updatedAt = new Date();
    await cart.save();
    
    res.json({ message: 'Cart cleared', cart });
  } catch (error) {
    res.status(500).json({ error: 'Error clearing cart' });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};