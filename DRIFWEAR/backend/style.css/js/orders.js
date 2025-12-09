// Order management functions
const API_BASE = '/api';

// Get user orders
async function getOrders() {
  try {
    const response = await fetch(`${API_BASE}/orders`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error('Failed to fetch orders');
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
    return [];
  }
}

// Get single order
async function getOrder(orderId) {
  try {
    const response = await fetch(`${API_BASE}/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error('Failed to fetch order');
    }
  } catch (error) {
    console.error('Error fetching order:', error);
    return null;
  }
}

// Create order
async function createOrder(orderData) {
  try {
    const response = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(orderData)
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create order');
    }
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

// Update order status
async function updateOrderStatus(orderId, status) {
  try {
    const response = await fetch(`${API_BASE}/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ status })
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error('Failed to update order status');
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    return null;
  }
}

// Cancel order
async function cancelOrder(orderId) {
  try {
    const response = await fetch(`${API_BASE}/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    if (response.ok) {
      return await response.json();
    } else {
      throw new Error('Failed to cancel order');
    }
  } catch (error) {
    console.error('Error canceling order:', error);
    return null;
  }
}