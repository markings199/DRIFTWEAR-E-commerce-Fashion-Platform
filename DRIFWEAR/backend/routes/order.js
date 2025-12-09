const express = require('express');
const router = express.Router();

// =============== ORDER ROUTES ===============

// Get all orders (for admin)
router.get('/', (req, res) => {
  try {
    console.log('📦 Getting all orders...');
    
    // In a real app, this would fetch from database
    // For now, return demo data
    res.json({
      success: true,
      message: 'Order routes are working',
      endpoints: {
        getAllOrders: 'GET /api/orders',
        getOrderById: 'GET /api/orders/:id',
        createOrder: 'POST /api/orders',
        updateOrder: 'PUT /api/orders/:id',
        deleteOrder: 'DELETE /api/orders/:id'
      }
    });
  } catch (error) {
    console.error('❌ Error in orders route:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process order request'
    });
  }
});

// Get order by ID
router.get('/:id', (req, res) => {
  try {
    const orderId = req.params.id;
    console.log(`📦 Getting order ${orderId}...`);
    
    res.json({
      success: true,
      message: `Order ${orderId} details`,
      order: {
        id: orderId,
        status: 'processing',
        total: 0,
        items: []
      }
    });
  } catch (error) {
    console.error('❌ Error getting order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get order'
    });
  }
});

// Create order
router.post('/', (req, res) => {
  try {
    console.log('📦 Creating new order...');
    console.log('   Order data:', req.body);
    
    const newOrder = {
      id: `ORD${Date.now()}`,
      ...req.body,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    
    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order: newOrder
    });
  } catch (error) {
    console.error('❌ Error creating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create order'
    });
  }
});

// Update order
router.put('/:id', (req, res) => {
  try {
    const orderId = req.params.id;
    console.log(`📦 Updating order ${orderId}...`);
    
    res.json({
      success: true,
      message: `Order ${orderId} updated successfully`,
      order: {
        id: orderId,
        ...req.body,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error updating order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update order'
    });
  }
});

// Delete order
router.delete('/:id', (req, res) => {
  try {
    const orderId = req.params.id;
    console.log(`📦 Deleting order ${orderId}...`);
    
    res.json({
      success: true,
      message: `Order ${orderId} deleted successfully`
    });
  } catch (error) {
    console.error('❌ Error deleting order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete order'
    });
  }
});

module.exports = router;