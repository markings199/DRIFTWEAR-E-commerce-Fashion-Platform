import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import adminService from '../services/admin.service';

const AdminOrders = ({ allOrders: propOrders, allUsers }) => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    if (propOrders && propOrders.length > 0) {
      setOrders(propOrders);
      setFilteredOrders(propOrders);
      setLoading(false);
    } else {
      loadOrders();
    }
  }, [propOrders]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  // ========== PAYMENT STATUS FUNCTIONS (Updated to match AdminDashboard) ==========
  const getPaymentStatusText = (order) => {
    // For online payments (GCash, PayMaya, Card), always show as Paid
    if (order.paymentMethod && 
        (order.paymentMethod.toLowerCase().includes('gcash') || 
         order.paymentMethod.toLowerCase().includes('paymaya') || 
         order.paymentMethod.toLowerCase().includes('card') ||
         order.paymentMethod.toLowerCase().includes('paymongo'))) {
      return 'Paid';
    }
    
    // Check payment status
    if (order.paymentStatus === 'paid') return 'Paid';
    if (order.paymentStatus === 'pending_cod') return 'Pending (COD)';
    if (order.paymentStatus === 'pending') return 'Paid';
    if (order.paymentStatus === 'failed') return '❌ Payment Failed';
    
    // Check for PayMongo payments
    if (order.paymongoSessionId || order.paymongoData) {
      return 'Paid';
    }
    
    // Check transaction ID
    if (order.transactionId && order.transactionId.startsWith('TXN')) {
      return 'Paid';
    }
    
    // Default for online payments
    if (order.paymentMethod && 
        (order.paymentMethod.includes('paymongo') || 
         order.paymentMethod === 'gcash' || 
         order.paymentMethod === 'paymaya' || 
         order.paymentMethod === 'card')) {
      return 'Paid';
    }
    
    return 'Paid';
  };

  const getOrderStatusText = (order) => {
    const paymentStatus = getPaymentStatusText(order);
    const orderStatus = order.status || 'pending';
    
    // If payment is confirmed as Paid, show appropriate order status
    if (paymentStatus === 'Paid') {
      if (orderStatus === 'processing' || orderStatus === 'pending' || orderStatus === 'pending_payment') {
        return 'Processing';
      }
      if (orderStatus === 'shipped') return 'Shipped';
      if (orderStatus === 'delivered') return 'Delivered';
      if (orderStatus === 'pending_payment') return 'Processing';
      return 'Processing';
    }
    
    if (orderStatus === 'pending' && order.paymentMethod === 'cod') {
      return 'Pending (COD)';
    }
    
    const statusMap = {
      'processing': 'Processing',
      'pending_payment': 'Processing',
      'shipped': 'Shipped',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
      'pending': 'Pending Payment',
      'return_requested': 'Return Requested',
      'refunded': 'Refunded'
    };
    
    return statusMap[orderStatus] || orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1);
  };

  const getStatusText = (order) => {
    const paymentStatus = getPaymentStatusText(order);
    const orderStatus = getOrderStatusText(order);
    
    if (paymentStatus === 'Paid') {
      if (orderStatus === 'Processing') return 'Paid & Processing';
      return orderStatus;
    }
    
    if (paymentStatus === 'Pending (COD)') {
      return 'Pending (COD)';
    }
    
    if (paymentStatus === '❌ Payment Failed') {
      return 'Payment Failed';
    }
    
    return orderStatus;
  };

  const getStatusColor = (order) => {
    // For online payments, always show green
    if (order.paymentMethod && 
        (order.paymentMethod.toLowerCase().includes('gcash') || 
         order.paymentMethod.toLowerCase().includes('paymaya') || 
         order.paymentMethod.toLowerCase().includes('card') ||
         order.paymentMethod.toLowerCase().includes('paymongo'))) {
      return '#4CAF50'; // Green for online payments
    }
    
    // Check payment status
    if (order.paymentStatus === 'paid' || order.paymentStatus === 'pending') return '#4CAF50';
    if (order.paymentStatus === 'failed') return '#F44336';
    
    // Check for PayMongo payments
    if (order.paymongoSessionId || order.paymongoData) {
      return '#4CAF50';
    }
    
    // Check order status
    const status = order.status || 'pending';
    switch (status) {
      case 'delivered': return '#4CAF50';
      case 'shipped': return '#2196F3';
      case 'processing': return '#FF9800';
      case 'cancelled': return '#F44336';
      case 'pending': 
        return order.paymentMethod === 'cod' ? '#FF9800' : '#4CAF50';
      case 'pending_payment': return '#4CAF50';
      case 'return_requested': return '#9C27B0';
      case 'refunded': return '#607D8B';
      default: return '#4CAF50';
    }
  };

  const isOrderPaid = (order) => {
    return order.paymentStatus === 'paid' || 
           order.paymentStatus === 'pending' ||
           order.paymentMethod?.toLowerCase().includes('gcash') ||
           order.paymentMethod?.toLowerCase().includes('paymaya') ||
           order.paymentMethod?.toLowerCase().includes('card') ||
           order.paymentMethod?.toLowerCase().includes('paymongo') ||
           order.paymongoSessionId || 
           order.paymongoData ||
           (order.transactionId && order.transactionId.startsWith('TXN')) ||
           (order.transactionId && order.transactionId.startsWith('DEMO_TXN'));
  };
  // ========== END PAYMENT STATUS FUNCTIONS ==========

  // ========== COMPREHENSIVE ORDER RETRIEVAL (Simplified to match AdminDashboard) ==========
  const getAllOrdersFromGlobal = () => {
    try {
      console.log('🔍 Scanning for orders in ALL storage locations...');
      
      let allOrders = [];
      
      // 1. Get from main global orders storage
      const globalOrdersKey = 'driftwear_all_orders';
      const globalOrders = JSON.parse(localStorage.getItem(globalOrdersKey) || '[]');
      console.log('Global orders found:', globalOrders.length);
      allOrders = [...globalOrders];
      
      // 2. Get from individual user storage
      const users = JSON.parse(localStorage.getItem('driftwear_users') || '[]');
      console.log('Users found:', users.length);
      
      users.forEach(user => {
        const userOrdersKey = `driftwear_orders_${user.id}`;
        const userOrders = JSON.parse(localStorage.getItem(userOrdersKey) || '[]');
        
        if (userOrders.length > 0) {
          console.log(`Found ${userOrders.length} orders for user ${user.email}`);
        }
        
        userOrders.forEach(order => {
          // Check if order already exists
          const existingIndex = allOrders.findIndex(o => o.id === order.id);
          
          if (existingIndex === -1) {
            // For online payments, set appropriate statuses
            const isOnlinePayment = order.paymentMethod && 
              (order.paymentMethod.toLowerCase().includes('gcash') || 
               order.paymentMethod.toLowerCase().includes('paymaya') || 
               order.paymentMethod.toLowerCase().includes('card') ||
               order.paymentMethod.toLowerCase().includes('paymongo'));
            
            // Auto-set online payments as paid
            if (isOnlinePayment) {
              order.paymentStatus = 'paid';
              order.status = 'processing';
            }
            
            // Add new order with complete user info
            allOrders.push({
              ...order,
              customerId: user.id,
              customerName: user.name || order.customerName || 'Unknown Customer',
              customerEmail: user.email || order.customerEmail || 'unknown@email.com',
              status: order.status || (order.paymentMethod === 'cod' ? 'processing' : 'processing'),
              paymentStatus: order.paymentStatus || 
                            (order.paymentMethod === 'cod' ? 'pending_cod' : 'paid'),
              orderNumber: order.orderNumber || `#${order.id?.slice(-8) || '00000000'}`,
              total: order.total || order.totalAmount || 0,
              createdAt: order.createdAt || order.orderDate || new Date().toISOString(),
              itemsRemoved: order.itemsRemoved || false
            });
          }
        });
      });
      
      // 3. Get from lastOrder (most recent order)
      const lastOrder = JSON.parse(localStorage.getItem('lastOrder') || 'null');
      if (lastOrder) {
        console.log('Last order found:', lastOrder.id);
        const existingIndex = allOrders.findIndex(order => order.id === lastOrder.id);
        
        // Auto-set online payments as paid
        if (lastOrder.paymentMethod && 
            (lastOrder.paymentMethod.toLowerCase().includes('gcash') || 
             lastOrder.paymentMethod.toLowerCase().includes('paymaya') || 
             lastOrder.paymentMethod.toLowerCase().includes('card') ||
             lastOrder.paymentMethod.toLowerCase().includes('paymongo'))) {
          lastOrder.paymentStatus = 'paid';
          lastOrder.status = 'processing';
        }
        
        if (existingIndex === -1) {
          allOrders.unshift({
            ...lastOrder,
            customerId: lastOrder.customerId || 'guest',
            customerName: lastOrder.customerName || 'Guest Customer',
            customerEmail: lastOrder.customerEmail || 'guest@email.com',
            status: lastOrder.status || 'processing',
            paymentStatus: lastOrder.paymentStatus || 'paid'
          });
        }
      }
      
      // 4. Get from successful_payment storage
      const successfulPayment = JSON.parse(localStorage.getItem('successful_payment') || 'null');
      if (successfulPayment) {
        console.log('Successful payment found for order:', successfulPayment.orderId);
        const orderIndex = allOrders.findIndex(order => order.id === successfulPayment.orderId);
        
        if (orderIndex !== -1) {
          allOrders[orderIndex].paymentStatus = 'paid';
          allOrders[orderIndex].status = 'processing';
        } else {
          // Create a new order entry from successful payment
          allOrders.unshift({
            id: successfulPayment.orderId,
            orderNumber: `#${successfulPayment.orderId?.slice(-8) || '00000000'}`,
            customerId: 'guest',
            customerName: 'Guest Customer',
            customerEmail: 'guest@email.com',
            status: 'processing',
            paymentStatus: 'paid',
            paymentMethod: successfulPayment.method || 'gcash',
            originalPaymentMethod: successfulPayment.method || 'gcash',
            total: successfulPayment.amount || 0,
            createdAt: successfulPayment.timestamp || new Date().toISOString(),
            itemsRemoved: true
          });
        }
      }
      
      // 5. Get from demo order
      const demoOrder = JSON.parse(localStorage.getItem('driftwear_last_demo_order') || 'null');
      if (demoOrder) {
        // Auto-set demo orders with online payments as paid
        if (demoOrder.paymentMethod && 
            (demoOrder.paymentMethod.toLowerCase().includes('gcash') || 
             demoOrder.paymentMethod.toLowerCase().includes('paymaya') || 
             demoOrder.paymentMethod.toLowerCase().includes('card') ||
             demoOrder.paymentMethod.toLowerCase().includes('paymongo'))) {
          demoOrder.paymentStatus = 'paid';
          demoOrder.status = 'processing';
        }
        
        const existingIndex = allOrders.findIndex(order => order.id === demoOrder.id);
        
        if (existingIndex === -1) {
          allOrders.unshift(demoOrder);
        }
      }
      
      // Remove duplicates
      const uniqueOrders = [];
      const seenIds = new Set();
      
      allOrders.forEach(order => {
        if (order && order.id && !seenIds.has(order.id)) {
          seenIds.add(order.id);
          uniqueOrders.push(order);
        }
      });
      
      // Sort by date (newest first)
      const sortedOrders = uniqueOrders.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.orderDate || 0);
        const dateB = new Date(b.createdAt || b.orderDate || 0);
        return dateB - dateA;
      });
      
      console.log(`✅ Total unique orders found: ${sortedOrders.length}`);
      return sortedOrders;
      
    } catch (error) {
      console.error('❌ Error getting all orders from global storage:', error);
      return [];
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔄 Loading orders...');
      
      let ordersData = [];
      
      // Try admin service first
      try {
        const response = await adminService.getAllOrders();
        console.log('Raw response from adminService:', response);
        
        if (Array.isArray(response)) {
          ordersData = response;
        } else if (response && response.data && Array.isArray(response.data)) {
          ordersData = response.data;
        } else if (response && response.status === 'success' && Array.isArray(response.data)) {
          ordersData = response.data;
        } else if (response && response.data && response.data.orders) {
          ordersData = response.data.orders;
        }
      } catch (serviceError) {
        console.log('Admin service error, using localStorage...', serviceError);
      }
      
      // If no orders from service, get from localStorage
      if (ordersData.length === 0) {
        ordersData = getAllOrdersFromGlobal();
      } else {
        // Combine with localStorage orders
        const localStorageOrders = getAllOrdersFromGlobal();
        const combinedOrders = [...ordersData];
        
        const seenIds = new Set(ordersData.map(o => o.id));
        
        localStorageOrders.forEach(order => {
          if (order.id && !seenIds.has(order.id)) {
            combinedOrders.push(order);
            seenIds.add(order.id);
          }
        });
        
        ordersData = combinedOrders;
      }
      
      console.log('📊 Processed orders:', ordersData.length);
      
      setOrders(ordersData);
      
    } catch (error) {
      console.error('❌ Error loading orders:', error);
      setError('Error loading orders. Please try again.');
      
      // Fallback to localStorage orders
      const localStorageOrders = getAllOrdersFromGlobal();
      if (localStorageOrders.length > 0) {
        setOrders(localStorageOrders);
      }
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = orders;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(order => {
        return (
          (order.id?.toLowerCase().includes(searchLower)) ||
          (order.orderNumber?.toLowerCase().includes(searchLower)) ||
          (order.customerName?.toLowerCase().includes(searchLower)) ||
          (order.customerEmail?.toLowerCase().includes(searchLower)) ||
          (getPaymentMethodDisplay(order).toLowerCase().includes(searchLower)) ||
          (getStatusText(order).toLowerCase().includes(searchLower))
        );
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => {
        if (statusFilter === 'processing') {
          return order.status === 'processing' || 
                 order.status === 'pending_payment' ||
                 (isOrderPaid(order) && (order.status === 'processing' || order.status === 'pending'));
        }
        
        if (statusFilter === 'pending') {
          return order.paymentMethod === 'cod' && (order.paymentStatus === 'pending_cod' || order.status === 'pending');
        }
        
        if (statusFilter === 'shipped') {
          return order.status === 'shipped';
        }
        
        if (statusFilter === 'delivered') {
          return order.status === 'delivered' || order.status === 'completed';
        }
        
        if (statusFilter === 'cancelled') {
          return order.status === 'cancelled';
        }
        
        return order.status === statusFilter;
      });
    }

    setFilteredOrders(filtered);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date Error';
    }
  };

  const getPaymentMethodDisplay = (order) => {
    const paymentMethod = order.paymentMethod || order.originalPaymentMethod;
    
    const methods = {
      'cod': 'Cash on Delivery',
      'gcash': 'GCash',
      'paymaya': 'PayMaya',
      'card': 'Credit/Debit Card',
      'paymongo_gcash': 'GCash (via PayMongo)',
      'paymongo_paymaya': 'PayMaya (via PayMongo)',
      'paymongo_card': 'Card (via PayMongo)',
      'paymongo_online': 'Online Payment'
    };
    
    return methods[paymentMethod] || paymentMethod || 'Unknown';
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      console.log('Updating order status:', orderId, 'to', newStatus);
      
      // Update in localStorage if exists
      let updated = false;
      
      // Check global orders storage
      const globalOrdersKey = 'driftwear_all_orders';
      const globalOrders = JSON.parse(localStorage.getItem(globalOrdersKey) || '[]');
      const globalOrderIndex = globalOrders.findIndex(order => order.id === orderId);
      
      if (globalOrderIndex !== -1) {
        globalOrders[globalOrderIndex].status = newStatus;
        
        // If setting to delivered for COD, mark payment as paid
        if (newStatus === 'delivered' && globalOrders[globalOrderIndex].paymentMethod === 'cod') {
          globalOrders[globalOrderIndex].paymentStatus = 'paid';
        }
        
        localStorage.setItem(globalOrdersKey, JSON.stringify(globalOrders));
        updated = true;
      }
      
      // Check individual user orders
      const users = JSON.parse(localStorage.getItem('driftwear_users') || '[]');
      for (const user of users) {
        const userOrdersKey = `driftwear_orders_${user.id}`;
        const userOrders = JSON.parse(localStorage.getItem(userOrdersKey) || '[]');
        const userOrderIndex = userOrders.findIndex(order => order.id === orderId);
        
        if (userOrderIndex !== -1) {
          userOrders[userOrderIndex].status = newStatus;
          
          // If setting to delivered for COD, mark payment as paid
          if (newStatus === 'delivered' && userOrders[userOrderIndex].paymentMethod === 'cod') {
            userOrders[userOrderIndex].paymentStatus = 'paid';
          }
          
          localStorage.setItem(userOrdersKey, JSON.stringify(userOrders));
          updated = true;
          break;
        }
      }
      
      // Also update in the orders state
      setOrders(prevOrders => 
        prevOrders.map(order => {
          if (order.id === orderId) {
            const updatedOrder = { ...order, status: newStatus };
            
            // If setting to delivered for COD, mark payment as paid
            if (newStatus === 'delivered' && order.paymentMethod === 'cod') {
              updatedOrder.paymentStatus = 'paid';
            }
            
            return updatedOrder;
          }
          return order;
        })
      );
      
      if (updated) {
        console.log('✅ Order status updated successfully');
      }
      
    } catch (error) {
      console.error('Error updating order status:', error);
      setError('Failed to update order status: ' + error.message);
    }
  };

  const refreshOrders = () => {
    setLoading(true);
    loadOrders();
  };

  // Calculate statistics for the summary
  const getStatistics = () => {
    const paidOrders = orders.filter(order => 
      order.paymentStatus === 'paid' || 
      (order.paymentMethod && 
       (order.paymentMethod.toLowerCase().includes('gcash') || 
        order.paymentMethod.toLowerCase().includes('paymaya') || 
        order.paymentMethod.toLowerCase().includes('card') ||
        order.paymentMethod.toLowerCase().includes('paymongo')))
    ).length;
    
    const pendingCOD = orders.filter(order => 
      order.paymentMethod === 'cod' && (order.paymentStatus === 'pending_cod' || order.status === 'pending')
    ).length;
    
    const processing = orders.filter(order => 
      order.status === 'processing' || order.status === 'pending_payment'
    ).length;
    
    const shipped = orders.filter(order => order.status === 'shipped').length;
    const delivered = orders.filter(order => order.status === 'delivered' || order.status === 'completed').length;
    const cancelled = orders.filter(order => order.status === 'cancelled').length;
    
    return { paidOrders, pendingCOD, processing, shipped, delivered, cancelled };
  };

  const stats = getStatistics();

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner"></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="admin-orders">
      <div className="dashboard-header">
        <h1>Order Management</h1>
        <p>Manage and track all customer orders</p>
        
        <div className="order-stats-summary">
          <div className="order-stat">
            <span className="stat-label">Total Orders:</span>
            <span className="stat-value">{orders.length}</span>
          </div>
          <div className="order-stat">
            <span className="stat-label">Paid Online:</span>
            <span className="stat-value" style={{color: '#4CAF50'}}>
              {stats.paidOrders}
            </span>
          </div>
          <div className="order-stat">
            <span className="stat-label">Pending COD:</span>
            <span className="stat-value" style={{color: '#FF9800'}}>
              {stats.pendingCOD}
            </span>
          </div>
          <div className="order-stat">
            <span className="stat-label">Processing:</span>
            <span className="stat-value" style={{color: '#2196F3'}}>
              {stats.processing}
            </span>
          </div>
          <div className="order-stat">
            <span className="stat-label">Shipped:</span>
            <span className="stat-value" style={{color: '#2196F3'}}>
              {stats.shipped}
            </span>
          </div>
          <div className="order-stat">
            <span className="stat-label">Delivered:</span>
            <span className="stat-value" style={{color: '#4CAF50'}}>
              {stats.delivered}
            </span>
          </div>
        </div>
        
        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
            <button onClick={refreshOrders} className="btn-retry">
              <i className="fas fa-redo"></i>
              Retry
            </button>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search orders by ID, customer, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="clear-search"
              onClick={() => setSearchTerm('')}
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
        
        <div className="filter-buttons">
          <button 
            className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All Orders ({orders.length})
          </button>
          <button 
            className={`filter-btn ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            Pending COD ({stats.pendingCOD})
          </button>
          <button 
            className={`filter-btn ${statusFilter === 'processing' ? 'active' : ''}`}
            onClick={() => setStatusFilter('processing')}
          >
            Processing ({stats.processing})
          </button>
          <button 
            className={`filter-btn ${statusFilter === 'shipped' ? 'active' : ''}`}
            onClick={() => setStatusFilter('shipped')}
          >
            Shipped ({stats.shipped})
          </button>
          <button 
            className={`filter-btn ${statusFilter === 'delivered' ? 'active' : ''}`}
            onClick={() => setStatusFilter('delivered')}
          >
            Delivered ({stats.delivered})
          </button>
          <button 
            className={`filter-btn ${statusFilter === 'cancelled' ? 'active' : ''}`}
            onClick={() => setStatusFilter('cancelled')}
          >
            Cancelled ({stats.cancelled})
          </button>
        </div>
        
        <button onClick={refreshOrders} className="refresh-btn">
          <i className="fas fa-sync"></i>
          Refresh
        </button>
      </div>

      {/* Orders List */}
      <div className="orders-list">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => (
            <div key={order.id || order.orderNumber} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <h3>Order {order.orderNumber || `#${order.id?.slice(-8) || order.id}`}</h3>
                  <div className="order-customer">
                    <strong>{order.customerName || 'Unknown Customer'}</strong>
                    <span className="customer-email">{order.customerEmail || 'No email'}</span>
                    {order.customerId && order.customerId.startsWith('guest') && (
                      <span className="guest-badge">Guest</span>
                    )}
                  </div>
                  {/* Payment Method Display */}
                  <div className="order-payment-method">
                    <i className="fas fa-credit-card"></i>
                    {getPaymentMethodDisplay(order)} • <span style={{
                      color: getPaymentStatusText(order) === 'Paid' ? '#4CAF50' : 
                             getPaymentStatusText(order) === 'Pending (COD)' ? '#FF9800' : '#F44336',
                      fontWeight: 'bold'
                    }}>{getPaymentStatusText(order)}</span>
                  </div>
                </div>
                <div className="order-meta">
                  <div className="order-amount">{formatPrice(order.total || order.totalAmount || order.amount || 0)}</div>
                  <div 
                    className="order-status"
                    style={{ backgroundColor: getStatusColor(order) }}
                  >
                    {getStatusText(order)}
                  </div>
                </div>
              </div>

              <div className="order-details">
                <div className="order-items">
                  {order.items?.length > 0 ? (
                    order.items.map((item, index) => (
                      <div key={index} className="order-item">
                        <span className="item-name">{item.name || 'Unknown Item'}</span>
                        <span className="item-quantity">x{item.quantity || 1}</span>
                        {item.price && (
                          <span className="item-price">{formatPrice(item.price)}</span>
                        )}
                      </div>
                    ))
                  ) : order.itemsRemoved ? (
                    <div className="order-item warning">
                      <i className="fas fa-exclamation-triangle"></i>
                      Items removed from cart after order
                    </div>
                  ) : (
                    <div className="order-item">No items information</div>
                  )}
                </div>
                <div className="order-date">
                  <i className="fas fa-calendar"></i>
                  {formatDate(order.createdAt || order.orderDate || order.date)}
                </div>
              </div>

              <div className="order-actions">
                <button 
                  className="btn-outline"
                  onClick={() => navigate(`/admin/orders/${order.id}`)}
                >
                  <i className="fas fa-eye"></i>
                  View Details
                </button>
                
                <select 
                  value={order.status || 'pending'}
                  onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                  className="status-select"
                  style={{
                    borderColor: getStatusColor(order),
                    backgroundColor: getStatusColor(order) + '20'
                  }}
                >
                  {order.paymentMethod === 'cod' ? (
                    <>
                      <option value="pending">Pending (COD)</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </>
                  ) : (
                    <>
                      <option value="processing">Paid & Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </>
                  )}
                </select>
                
                <button 
                  className="btn-icon"
                  onClick={() => {
                    // Copy order ID to clipboard
                    navigator.clipboard.writeText(order.id || order.orderNumber);
                    alert(`Order ID ${order.id || order.orderNumber} copied to clipboard!`);
                  }}
                  title="Copy Order ID"
                >
                  <i className="fas fa-copy"></i>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-data">
            <i className="fas fa-shopping-bag"></i>
            <h3>No orders found</h3>
            <p>Try adjusting your search or filters</p>
            <button onClick={refreshOrders} className="btn-retry">
              <i className="fas fa-redo"></i>
              Refresh Orders
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;