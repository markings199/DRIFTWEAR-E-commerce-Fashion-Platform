// Enhanced admin service with better debugging
const adminService = {
  getDashboardStats: async () => {
    try {
      console.log('=== Getting Dashboard Stats ===');
      const users = JSON.parse(localStorage.getItem('driftwear_users') || '[]');
      const allOrders = getAllOrdersFromStorage();
      
      console.log('Dashboard stats - Users:', users.length, 'Orders:', allOrders.length);
      
      const stats = {
        totalSales: calculateTotalSales(allOrders),
        totalOrders: allOrders.length,
        totalCustomers: users.length,
        pendingOrders: allOrders.filter(order => 
          order.status === 'pending' || order.status === 'processing'
        ).length,
        unreadMessages: 0,
        lowStockProducts: 0
      };

      const recentOrders = allOrders
        .sort((a, b) => new Date(b.createdAt || b.orderDate) - new Date(a.createdAt || a.orderDate))
        .slice(0, 5)
        .map(order => ({
          id: order.id || order.orderNumber,
          customer: order.userName || order.customer?.name || 'Unknown Customer',
          amount: order.totalAmount || order.total || 0,
          status: order.status || 'pending'
        }));

      return {
        status: 'success',
        data: {
          stats,
          recentOrders,
          recentMessages: []
        }
      };
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      return {
        status: 'error',
        message: 'Failed to load dashboard data',
        data: {
          stats: {
            totalSales: 0,
            totalOrders: 0,
            totalCustomers: 0,
            pendingOrders: 0,
            unreadMessages: 0,
            lowStockProducts: 0
          },
          recentOrders: [],
          recentMessages: []
        }
      };
    }
  },

  getAllOrders: async () => {
    try {
      console.log('=== Getting All Orders ===');
      const orders = getAllOrdersFromStorage();
      console.log('Found orders:', orders.length);
      
      // Return as array directly for AdminOrders component
      return orders;
    } catch (error) {
      console.error('Error in getAllOrders:', error);
      throw new Error('Failed to load orders: ' + error.message);
    }
  },

  updateOrderStatus: async (orderId, newStatus) => {
    try {
      console.log('=== Updating Order Status ===');
      console.log('Order ID:', orderId, 'New Status:', newStatus);
      
      const users = JSON.parse(localStorage.getItem('driftwear_users') || '[]');
      let updated = false;

      // Update in user-specific orders
      users.forEach(user => {
        const userOrdersKey = `driftwear_orders_${user.id}`;
        const userOrders = JSON.parse(localStorage.getItem(userOrdersKey) || '[]');
        const orderIndex = userOrders.findIndex(order => 
          order.id === orderId || order.orderNumber === orderId
        );
        
        if (orderIndex !== -1) {
          userOrders[orderIndex].status = newStatus;
          userOrders[orderIndex].updatedAt = new Date().toISOString();
          localStorage.setItem(userOrdersKey, JSON.stringify(userOrders));
          updated = true;
          console.log('Updated order in user storage:', userOrdersKey);
        }
      });

      // Also update in global orders
      const globalOrdersKey = 'driftwear_orders';
      const globalOrders = JSON.parse(localStorage.getItem(globalOrdersKey) || '[]');
      const globalOrderIndex = globalOrders.findIndex(order => 
        order.id === orderId || order.orderNumber === orderId
      );
      
      if (globalOrderIndex !== -1) {
        globalOrders[globalOrderIndex].status = newStatus;
        globalOrders[globalOrderIndex].updatedAt = new Date().toISOString();
        localStorage.setItem(globalOrdersKey, JSON.stringify(globalOrders));
        updated = true;
        console.log('Updated order in global storage');
      }

      if (!updated) {
        console.warn('Order not found in any storage:', orderId);
        return { 
          status: 'error', 
          message: `Order ${orderId} not found` 
        };
      }

      return { 
        status: 'success', 
        message: `Order ${orderId} status updated to ${newStatus}` 
      };
    } catch (error) {
      console.error('Error in updateOrderStatus:', error);
      throw new Error('Failed to update order status: ' + error.message);
    }
  },

  getAllCustomers: async () => {
    try {
      const users = JSON.parse(localStorage.getItem('driftwear_users') || '[]');
      return users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        joinedDate: user.createdAt,
        ordersCount: getOrderCountForUser(user.id)
      }));
    } catch (error) {
      console.error('Error in getAllCustomers:', error);
      throw new Error('Failed to load customers');
    }
  },

  // Debug method to check localStorage
  debugStorage: () => {
    console.log('=== LOCALSTORAGE DEBUG ===');
    const orderKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('driftwear')) {
        orderKeys.push(key);
        try {
          const data = JSON.parse(localStorage.getItem(key));
          console.log(`${key}:`, Array.isArray(data) ? `${data.length} items` : data);
        } catch (e) {
          console.log(`${key}:`, localStorage.getItem(key));
        }
      }
    }
    console.log('Order-related keys:', orderKeys);
    console.log('=== END DEBUG ===');
  }
};

// Enhanced function to get orders from all possible locations
const getAllOrdersFromStorage = () => {
  try {
    console.log('=== Scanning localStorage for orders ===');
    const allOrders = [];
    
    // Method 1: Check user-specific orders
    const users = JSON.parse(localStorage.getItem('driftwear_users') || '[]');
    console.log('Found users:', users.length);

    users.forEach(user => {
      const userOrdersKey = `driftwear_orders_${user.id}`;
      const userOrders = JSON.parse(localStorage.getItem(userOrdersKey) || '[]');
      console.log(`User ${user.name} (${user.id}): ${userOrders.length} orders`);
      
      userOrders.forEach(order => {
        const orderWithUserInfo = {
          ...order,
          customer: {
            id: user.id,
            name: user.name,
            email: user.email
          },
          userName: user.name,
          userEmail: user.email,
          id: order.id || order.orderNumber,
          totalAmount: order.totalAmount || order.total || 0,
          status: order.status || 'pending',
          createdAt: order.createdAt || order.orderDate,
          items: order.items || []
        };
        allOrders.push(orderWithUserInfo);
      });
    });

    // Method 2: Check global orders
    const globalOrdersKey = 'driftwear_orders';
    const globalOrders = JSON.parse(localStorage.getItem(globalOrdersKey) || '[]');
    console.log('Global orders:', globalOrders.length);
    
    globalOrders.forEach(order => {
      const orderWithUserInfo = {
        ...order,
        customer: {
          id: order.userId,
          name: order.userName || 'Unknown Customer',
          email: order.userEmail || 'No email'
        },
        userName: order.userName || 'Unknown Customer',
        userEmail: order.userEmail || 'No email',
        id: order.id || order.orderNumber,
        totalAmount: order.totalAmount || order.total || 0,
        status: order.status || 'pending',
        createdAt: order.createdAt || order.orderDate,
        items: order.items || []
      };
      allOrders.push(orderWithUserInfo);
    });

    // Method 3: Check all localStorage keys that might contain orders
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('driftwear_orders_') && !key.includes(users.map(u => u.id).join('|'))) {
        console.log('Found additional order key:', key);
        try {
          const additionalOrders = JSON.parse(localStorage.getItem(key) || '[]');
          additionalOrders.forEach(order => {
            allOrders.push({
              ...order,
              id: order.id || order.orderNumber,
              totalAmount: order.totalAmount || order.total || 0,
              status: order.status || 'pending',
              createdAt: order.createdAt || order.orderDate,
              items: order.items || []
            });
          });
        } catch (e) {
          console.error('Error parsing orders from', key, e);
        }
      }
    }

    console.log('Total orders found:', allOrders.length);
    
    // Remove duplicates based on order ID
    const uniqueOrders = [];
    const seenIds = new Set();
    
    allOrders.forEach(order => {
      const orderId = order.id || order.orderNumber;
      if (orderId && !seenIds.has(orderId)) {
        seenIds.add(orderId);
        uniqueOrders.push(order);
      }
    });
    
    console.log('Unique orders after deduplication:', uniqueOrders.length);
    
    // Sort by date (newest first)
    return uniqueOrders.sort((a, b) => 
      new Date(b.createdAt || b.orderDate) - new Date(a.createdAt || a.orderDate)
    );
  } catch (error) {
    console.error('Error in getAllOrdersFromStorage:', error);
    return [];
  }
};

const calculateTotalSales = (orders) => {
  try {
    return orders
      .filter(order => order.status === 'delivered' || order.status === 'completed' || order.status === 'shipped')
      .reduce((total, order) => total + (order.totalAmount || 0), 0);
  } catch (error) {
    console.error('Error in calculateTotalSales:', error);
    return 0;
  }
};

const getOrderCountForUser = (userId) => {
  try {
    const userOrdersKey = `driftwear_orders_${userId}`;
    const userOrders = JSON.parse(localStorage.getItem(userOrdersKey) || '[]');
    return userOrders.length;
  } catch (error) {
    console.error('Error in getOrderCountForUser:', error);
    return 0;
  }
};

export default adminService;