const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Get all orders for a user
const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product')
      .sort({ createdAt: -1 });
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching orders' });
  }
};

// Get single order
const getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Check if user owns the order
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching order' });
  }
};

// Create new order from cart
const createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;
    
    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }
    
    // Check stock for all items
    for (const item of cart.items) {
      const product = await Product.findById(item.product._id);
      if (product.stock < item.quantity) {
        return res.status(400).json({ 
          error: `Not enough stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
        });
      }
    }
    
    // Create order items from cart items
    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      price: item.product.price,
      size: item.size,
      color: item.color
    }));
    
    // Calculate total
    const total = cart.total;
    
    // Create order
    const order = new Order({
      user: req.user._id,
      items: orderItems,
      total,
      shippingAddress,
      paymentMethod
    });
    
    await order.save();
    
    // Update product stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(
        item.product._id,
        { $inc: { stock: -item.quantity } }
      );
    }
    
    // Clear cart
    cart.items = [];
    cart.total = 0;
    cart.updatedAt = new Date();
    await cart.save();
    
    // Populate product details before sending response
    await order.populate('items.product');
    
    res.status(201).json({ message: 'Order created successfully', order });
  } catch (error) {
    res.status(500).json({ error: 'Error creating order' });
  }
};

// Update order status (admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    ).populate('items.product');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({ message: 'Order status updated', order });
  } catch (error) {
    res.status(500).json({ error: 'Error updating order status' });
  }
};

module.exports = {
  getOrders,
  getOrder,
  createOrder,
  updateOrderStatus
};