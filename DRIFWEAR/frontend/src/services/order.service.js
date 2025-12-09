import api from './api';

export const orderService = {
  // Get order by ID
  async getOrderById(orderId) {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  },

  // Get user's order history
  async getOrderHistory() {
    try {
      const response = await api.get('/orders/history');
      return response.data;
    } catch (error) {
      console.error('Error fetching order history:', error);
      throw error;
    }
  },

  // Create new order
  async createOrder(orderData) {
    try {
      const response = await api.post('/orders', orderData);
      
      // Store last order in localStorage for confirmation page
      localStorage.setItem('lastOrder', JSON.stringify({
        ...response.data,
        orderId: response.data.id
      }));
      
      return response.data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // Cancel order
  async cancelOrder(orderId) {
    try {
      const response = await api.put(`/orders/${orderId}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error canceling order:', error);
      throw error;
    }
  },

  // Get order status
  async getOrderStatus(orderId) {
    try {
      const response = await api.get(`/orders/${orderId}/status`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order status:', error);
      throw error;
    }
  },

  // Get all orders for admin (from localStorage) - Enhanced version
  getAllOrdersForAdmin() {
    try {
      console.log('=== OrderService: Getting all orders for admin ===');
      const allOrders = [];
      
      // Get all keys from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        // Look for order keys (user-specific and global)
        if (key && (key.startsWith('driftwear_orders_') || key === 'driftwear_orders')) {
          console.log('Found order key:', key);
          const userOrders = JSON.parse(localStorage.getItem(key) || '[]');
          console.log(`Found ${userOrders.length} orders in ${key}`);
          
          // Add user information to each order
          const ordersWithUserInfo = userOrders.map(order => {
            // Try to get user info from users storage
            let userName = 'Unknown Customer';
            let userEmail = 'No email';
            let userId = 'unknown';
            
            if (key.startsWith('driftwear_orders_')) {
              userId = key.replace('driftwear_orders_', '');
              const users = JSON.parse(localStorage.getItem('driftwear_users') || '[]');
              const user = users.find(u => u.id === userId);
              if (user) {
                userName = user.name;
                userEmail = user.email;
              }
            } else if (key === 'driftwear_orders') {
              // For global orders, use the user info stored in the order itself
              userName = order.userName || 'Unknown Customer';
              userEmail = order.userEmail || 'No email';
              userId = order.userId || 'global';
            }
            
            return {
              ...order,
              userName,
              userEmail,
              userId: userId,
              userKey: key,
              // Ensure consistent field names
              id: order.id || order.orderNumber,
              totalAmount: order.totalAmount || order.total || 0,
              status: order.status || 'pending',
              createdAt: order.createdAt || order.orderDate,
              items: order.items || []
            };
          });
          
          allOrders.push(...ordersWithUserInfo);
        }
      }
      
      console.log('OrderService: Total orders found for admin:', allOrders.length);
      
      // Sort by date (newest first)
      return allOrders.sort((a, b) => 
        new Date(b.createdAt || b.orderDate) - new Date(a.createdAt || a.orderDate)
      );
    } catch (error) {
      console.error('Error getting all orders for admin:', error);
      return [];
    }
  },

  // Get dashboard stats for admin
  getAdminDashboardStats() {
    try {
      const allOrders = this.getAllOrdersForAdmin();
      const allUsers = JSON.parse(localStorage.getItem('driftwear_users') || '[]');
      
      console.log('Calculating admin stats from:', allOrders.length, 'orders and', allUsers.length, 'users');
      
      const totalSales = allOrders.reduce((sum, order) => sum + (order.totalAmount || order.total || 0), 0);
      const pendingOrders = allOrders.filter(order => 
        order.status === 'pending' || order.status === 'processing'
      ).length;
      
      const stats = {
        totalSales,
        totalOrders: allOrders.length,
        totalCustomers: allUsers.length,
        pendingOrders,
        unreadMessages: 0,
        lowStockProducts: 0
      };
      
      const recentOrders = allOrders.slice(0, 5).map(order => ({
        id: order.orderNumber || order.id,
        customer: order.userName || order.shippingAddress?.name || 'Unknown Customer',
        amount: order.totalAmount || order.total || 0,
        status: order.status || 'pending'
      }));
      
      console.log('Admin dashboard stats:', stats);
      console.log('Recent orders for admin:', recentOrders);
      
      return {
        status: 'success',
        data: {
          stats,
          recentOrders
        }
      };
    } catch (error) {
      console.error('Error getting admin dashboard stats:', error);
      return {
        status: 'error',
        data: {
          stats: {
            totalSales: 0,
            totalOrders: 0,
            totalCustomers: 0,
            pendingOrders: 0,
            unreadMessages: 0,
            lowStockProducts: 0
          },
          recentOrders: []
        }
      };
    }
  },

  // Update order status (for admin)
  updateOrderStatus(orderId, newStatus) {
    try {
      console.log('OrderService: Updating order status:', orderId, 'to', newStatus);
      
      let orderUpdated = false;
      
      // Update order in all possible storage locations
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key && (key.startsWith('driftwear_orders_') || key === 'driftwear_orders')) {
          const orders = JSON.parse(localStorage.getItem(key) || '[]');
          let updated = false;
          
          const updatedOrders = orders.map(order => {
            if (order.id === orderId || order.orderNumber === orderId) {
              updated = true;
              orderUpdated = true;
              return {
                ...order,
                status: newStatus,
                updatedAt: new Date().toISOString()
              };
            }
            return order;
          });
          
          if (updated) {
            localStorage.setItem(key, JSON.stringify(updatedOrders));
            console.log(`Order updated in storage: ${key}`);
          }
        }
      }
      
      if (orderUpdated) {
        return { success: true, message: `Order ${orderId} status updated to ${newStatus}` };
      } else {
        return { success: false, message: `Order ${orderId} not found` };
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      return { success: false, message: 'Error updating order status' };
    }
  }
};

export default orderService;