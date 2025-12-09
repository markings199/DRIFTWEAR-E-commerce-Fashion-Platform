import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { messageService } from '../services/message.service';
import "../css/UserProfile.css";

function UserProfile({ currentUser, openAuthModal, getUserOrders, getOrderStats, onLogout, onSendMessage, formatPrice }) {
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState({
    orders: 0,
    wishlistItems: 0,
    cartItems: 0
  });
  const [userOrders, setUserOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [orderFilter, setOrderFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  
  // Messenger states
  const [showContactModal, setShowContactModal] = useState(false);
  const [showMessagesModal, setShowMessagesModal] = useState(false);
  const [userMessages, setUserMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
    priority: 'medium',
    orderId: ''
  });

  useEffect(() => {
    if (currentUser) {
      loadUserData();
      loadUserMessages();
    }
  }, [currentUser]);

  const loadUserData = async () => {
    try {
      console.log('📊 Loading user data for:', currentUser.id);
      
      // Load cart items
      const cartKey = `driftwear_cart_${currentUser.id}`;
      const cartData = localStorage.getItem(cartKey);
      const cartItems = cartData ? JSON.parse(cartData).length : 0;

      // Load wishlist items
      const wishlistKey = `driftwear_wishlist_${currentUser.id}`;
      const wishlistData = localStorage.getItem(wishlistKey);
      const wishlistItems = wishlistData ? JSON.parse(wishlistData).length : 0;

      // FIXED: Use getUserOrders prop to get orders with correct payment status
      let orders = [];
      if (getUserOrders) {
        orders = getUserOrders();
      } else {
        // Fallback: Load orders directly
        const orderKey = `driftwear_orders_${currentUser.id}`;
        const ordersData = localStorage.getItem(orderKey);
        orders = ordersData ? JSON.parse(ordersData) : [];
      }
      
      // Sort orders by date (newest first)
      orders.sort((a, b) => new Date(b.createdAt || b.orderDate) - new Date(a.createdAt || a.orderDate));
      
      console.log(`✅ Loaded ${orders.length} orders for user`);
      
      // Debug: Log payment statuses
      orders.forEach(order => {
        console.log(`   Order ${order.id || order.orderNumber}: 
          Status: ${order.status}, 
          Payment Status: ${order.paymentStatus}, 
          Payment Method: ${order.paymentMethod},
          Original Method: ${order.originalPaymentMethod}`);
      });
      
      setUserStats({
        orders: orders.length,
        wishlistItems,
        cartItems
      });
      
      setUserOrders(orders);
    } catch (error) {
      console.error('❌ Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserMessages = () => {
    if (!currentUser) return;
    
    try {
      const messages = messageService.getMessagesByUser(currentUser.id);
      setUserMessages(messages);
    } catch (error) {
      console.error('Error loading user messages:', error);
    }
  };

  // Contact Support Functions
  const handleContactSupport = () => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }
    setShowContactModal(true);
  };

  const handleViewMessages = () => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }
    setShowMessagesModal(true);
    loadUserMessages();
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    
    if (!contactForm.subject || !contactForm.message) {
      alert('Please fill in all required fields');
      return;
    }

    const messageData = {
      userId: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      subject: contactForm.subject,
      message: contactForm.message,
      priority: contactForm.priority,
      orderId: contactForm.orderId
    };

    const result = messageService.saveMessage(messageData);
    
    if (result.status === 'success') {
      alert('Message sent successfully! We will get back to you within 24 hours.');
      setContactForm({
        subject: '',
        message: '',
        priority: 'medium',
        orderId: ''
      });
      setShowContactModal(false);
      loadUserMessages();
    } else {
      alert('Failed to send message. Please try again.');
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const replyData = {
      senderName: currentUser.name,
      senderType: 'user',
      message: newMessage
    };

    const result = messageService.addReply(selectedConversation.id, replyData);
    
    if (result.status === 'success') {
      setNewMessage('');
      // Reload the conversation
      const updatedConversation = messageService.getConversation(selectedConversation.id);
      setSelectedConversation(updatedConversation);
      loadUserMessages();
    }
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const selectConversation = (message) => {
    setSelectedConversation(message);
    // Mark as read when user opens conversation
    if (message.status === 'unread') {
      messageService.markAsRead(message.id);
      loadUserMessages();
    }
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Date not available';
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

  const getUnreadCount = () => {
    return userMessages.filter(msg => msg.status === 'unread').length;
  };

  // ========== PAYMENT STATUS FUNCTIONS ==========
  
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

  const getPaymentStatusText = (order) => {
    // First check payment status
    if (order.paymentStatus === 'paid') return '✓ Paid';
    if (order.paymentStatus === 'pending_cod') return '⏳ Pending (COD)';
    if (order.paymentStatus === 'pending') return '✓ Paid & Processing'; // CHANGED: Pending Payment to Paid & Processing
    if (order.paymentStatus === 'failed') return '❌ Payment Failed';
    
    // For backward compatibility - check if it's a PayMongo payment
    if (order.paymongoSessionId || order.paymongoData) {
      return '✓ Paid';
    }
    
    // Check transaction ID
    if (order.transactionId && order.transactionId.startsWith('TXN')) {
      return '✓ Paid';
    }
    
    // Check for PayMongo payments specifically
    if (order.paymentMethod && 
        (order.paymentMethod.includes('paymongo') || 
         order.paymentMethod === 'gcash' || 
         order.paymentMethod === 'paymaya' || 
         order.paymentMethod === 'card')) {
      return '✓ Paid';
    }
    
    return '✓ Paid & Processing'; // CHANGED: Default to Paid & Processing
  };

  const getOrderStatusText = (order) => {
    // Combine order status and payment status for better clarity
    const paymentStatus = getPaymentStatusText(order);
    const orderStatus = order.status || 'pending';
    
    // If payment is confirmed (Paid or Paid & Processing), show appropriate order status
    if (paymentStatus === '✓ Paid' || paymentStatus === '✓ Paid & Processing') {
      if (orderStatus === 'processing' || orderStatus === 'pending' || orderStatus === 'pending_payment') {
        return 'Processing';
      }
      if (orderStatus === 'shipped') return 'Shipped';
      if (orderStatus === 'delivered') return 'Delivered';
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
    
    return statusMap[orderStatus] || 'Pending Payment';
  };

  const getStatusColor = (order) => {
    // Check payment status first
    if (order.paymentStatus === 'paid' || order.paymentStatus === 'pending') return '#4CAF50'; // Green for paid or pending (now Paid & Processing)
    if (order.paymentStatus === 'failed') return '#F44336'; // Red for failed
    
    // Check for PayMongo payments
    if (order.paymongoSessionId || order.paymongoData) {
      return '#4CAF50'; // Green for PayMongo payments
    }
    
    // Check for online payment methods
    if (order.paymentMethod && 
        (order.paymentMethod.includes('paymongo') || 
         order.paymentMethod === 'gcash' || 
         order.paymentMethod === 'paymaya' || 
         order.paymentMethod === 'card')) {
      return '#4CAF50'; // Green for online payments
    }
    
    // Check order status
    const status = order.status || 'pending';
    switch (status) {
      case 'delivered': return '#4CAF50';
      case 'shipped': return '#2196F3';
      case 'processing': return '#FF9800';
      case 'cancelled': return '#F44336';
      case 'pending': 
        return order.paymentMethod === 'cod' ? '#FF9800' : '#4CAF50'; // Changed pending to green for online payments
      case 'return_requested': return '#9C27B0';
      case 'refunded': return '#607D8B';
      default: return '#4CAF50'; // Changed default to green
    }
  };

  const getStatusText = (order) => {
    // Show combined status
    const paymentStatus = getPaymentStatusText(order);
    const orderStatus = getOrderStatusText(order);
    
    if (paymentStatus === '✓ Paid' || paymentStatus === '✓ Paid & Processing') {
      if (orderStatus === 'Processing') return 'Paid & Processing';
      return orderStatus;
    }
    
    if (paymentStatus === '⏳ Pending (COD)') {
      return 'Pending (COD)';
    }
    
    if (paymentStatus === '❌ Payment Failed') {
      return 'Payment Failed';
    }
    
    return orderStatus;
  };

  const isOrderPaid = (order) => {
    // Check various indicators of payment
    return order.paymentStatus === 'paid' || 
           order.paymentStatus === 'pending' || // Added: pending now means paid & processing
           order.paymongoSessionId || 
           order.paymongoData ||
           (order.transactionId && order.transactionId.startsWith('TXN')) ||
           (order.transactionId && order.transactionId.startsWith('DEMO_TXN')) ||
           (order.paymentMethod && 
            (order.paymentMethod.includes('paymongo') || 
             order.paymentMethod === 'gcash' || 
             order.paymentMethod === 'paymaya' || 
             order.paymentMethod === 'card'));
  };

  // ========== ORDER FILTERING ==========
  
  const categorizeOrders = (orders) => {
    const categorized = {
      all: orders,
      toPay: orders.filter(order => 
        !isOrderPaid(order) && 
        order.status !== 'cancelled' && 
        order.status !== 'delivered'
      ),
      toShip: orders.filter(order => 
        isOrderPaid(order) && 
        (order.status === 'processing' || order.status === 'pending' || order.status === 'pending_payment') && 
        !order.shippedAt
      ),
      toReceive: orders.filter(order => 
        order.status === 'shipped' && 
        order.shippedAt && 
        !order.deliveredAt
      ),
      completed: orders.filter(order => order.status === 'delivered'),
      cancelled: orders.filter(order => order.status === 'cancelled'),
      returnRefund: orders.filter(order => order.status === 'return_requested' || order.status === 'refunded')
    };
    
    return categorized;
  };

  const getFilteredOrders = () => {
    const categorized = categorizeOrders(userOrders);
    return categorized[orderFilter] || [];
  };

  const getOrderCountByStatus = (status) => {
    const categorized = categorizeOrders(userOrders);
    return categorized[status]?.length || 0;
  };

  const getFilterDisplayName = (filter) => {
    switch (filter) {
      case 'all': return 'All Orders';
      case 'toPay': return 'To Pay';
      case 'toShip': return 'To Ship';
      case 'toReceive': return 'To Receive';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'returnRefund': return 'Return/Refund';
      default: return 'All Orders';
    }
  };

  // ========== ORDER ACTIONS ==========
  
  const cancelOrder = async (orderId) => {
    if (!currentUser) return;
    
    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }
    
    setCancellingOrder(orderId);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const orderKey = `driftwear_orders_${currentUser.id}`;
      const ordersData = localStorage.getItem(orderKey);
      
      if (ordersData) {
        const orders = JSON.parse(ordersData);
        const updatedOrders = orders.map(order => {
          if (order.id === orderId) {
            // Only allow cancellation for non-paid, non-shipped orders
            if (!isOrderPaid(order) && order.status !== 'shipped' && order.status !== 'delivered') {
              return {
                ...order,
                status: 'cancelled',
                paymentStatus: 'cancelled',
                cancelledAt: new Date().toISOString()
              };
            }
          }
          return order;
        });
        
        localStorage.setItem(orderKey, JSON.stringify(updatedOrders));
        
        // Update global orders
        const globalOrdersKey = 'driftwear_all_orders';
        const globalOrders = JSON.parse(localStorage.getItem(globalOrdersKey) || '[]');
        const updatedGlobalOrders = globalOrders.map(order => {
          if (order.id === orderId) {
            if (!isOrderPaid(order) && order.status !== 'shipped' && order.status !== 'delivered') {
              return {
                ...order,
                status: 'cancelled',
                paymentStatus: 'cancelled',
                cancelledAt: new Date().toISOString()
              };
            }
          }
          return order;
        });
        localStorage.setItem(globalOrdersKey, JSON.stringify(updatedGlobalOrders));
        
        // Refresh orders
        loadUserData();
        
        console.log(`Order ${orderId} cancelled successfully`);
        alert('Order cancelled successfully.');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order. Please try again.');
    } finally {
      setCancellingOrder(null);
    }
  };

  const canCancelOrder = (order) => {
    // Can only cancel if not paid, not shipped, not delivered, not already cancelled
    if (order.status === 'cancelled') return false;
    if (isOrderPaid(order)) return false;
    if (order.status === 'shipped' || order.status === 'delivered') return false;
    
    // Check if within cancellation window (24 hours)
    const orderDate = new Date(order.createdAt || order.orderDate);
    const now = new Date();
    const hoursDiff = (now - orderDate) / (1000 * 60 * 60);
    
    return hoursDiff <= 24;
  };

  const canPayOrder = (order) => {
    // Only COD orders can be "paid" (they're actually already pending)
    // Online payments are already handled by PayMongo
    return order.paymentMethod === 'cod' && 
           order.paymentStatus === 'pending_cod' && 
           order.status !== 'cancelled';
  };

  const payForOrder = async (orderId) => {
    if (!currentUser) return;
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const orderKey = `driftwear_orders_${currentUser.id}`;
      const ordersData = localStorage.getItem(orderKey);
      
      if (ordersData) {
        const orders = JSON.parse(ordersData);
        const updatedOrders = orders.map(order => {
          if (order.id === orderId && order.paymentMethod === 'cod' && order.paymentStatus === 'pending_cod') {
            return {
              ...order,
              paymentStatus: 'paid',
              status: 'processing',
              paymentDate: new Date().toISOString()
            };
          }
          return order;
        });
        
        localStorage.setItem(orderKey, JSON.stringify(updatedOrders));
        
        // Update global orders
        const globalOrdersKey = 'driftwear_all_orders';
        const globalOrders = JSON.parse(localStorage.getItem(globalOrdersKey) || '[]');
        const updatedGlobalOrders = globalOrders.map(order => {
          if (order.id === orderId && order.paymentMethod === 'cod' && order.paymentStatus === 'pending_cod') {
            return {
              ...order,
              paymentStatus: 'paid',
              status: 'processing',
              paymentDate: new Date().toISOString()
            };
          }
          return order;
        });
        localStorage.setItem(globalOrdersKey, JSON.stringify(updatedGlobalOrders));
        
        // Refresh orders
        loadUserData();
        
        alert('Payment confirmed! Your COD order is now being processed.');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Failed to process payment. Please try again.');
    }
  };

  const canRequestReturn = (order) => {
    return order.status === 'delivered' && !order.returnRequestedAt;
  };

  const requestReturnRefund = async (orderId) => {
    if (!currentUser) return;
    
    const reason = prompt('Please provide reason for return/refund:');
    if (!reason) return;
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const orderKey = `driftwear_orders_${currentUser.id}`;
      const ordersData = localStorage.getItem(orderKey);
      
      if (ordersData) {
        const orders = JSON.parse(ordersData);
        const updatedOrders = orders.map(order => {
          if (order.id === orderId && order.status === 'delivered') {
            return {
              ...order,
              status: 'return_requested',
              returnReason: reason,
              returnRequestedAt: new Date().toISOString()
            };
          }
          return order;
        });
        
        localStorage.setItem(orderKey, JSON.stringify(updatedOrders));
        loadUserData();
        
        alert('Return request submitted successfully! We will contact you within 24 hours.');
      }
    } catch (error) {
      console.error('Error requesting return:', error);
      alert('Failed to submit return request. Please try again.');
    }
  };

  const getCancellationMessage = (order) => {
    if (order.status === 'cancelled') {
      return 'This order has been cancelled';
    }
    
    if (isOrderPaid(order)) {
      return 'Order has been paid and cannot be cancelled';
    }
    
    if (order.status === 'shipped') {
      return 'Order has been shipped and cannot be cancelled';
    }
    
    if (order.status === 'delivered') {
      return 'Order has been delivered and cannot be cancelled';
    }
    
    const orderDate = new Date(order.createdAt || order.orderDate);
    const now = new Date();
    const hoursDiff = (now - orderDate) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      return 'Cancellation window (24 hours) has expired';
    }
    
    return 'You can cancel this order within 24 hours of placement';
  };

  const OrderFilterButtons = () => (
    <div className="order-filters">
      <button 
        className={`filter-btn ${orderFilter === 'all' ? 'active' : ''}`}
        onClick={() => setOrderFilter('all')}
      >
        All Orders ({getOrderCountByStatus('all')})
      </button>
      <button 
        className={`filter-btn ${orderFilter === 'toPay' ? 'active' : ''}`}
        onClick={() => setOrderFilter('toPay')}
      >
        To Pay ({getOrderCountByStatus('toPay')})
      </button>
      <button 
        className={`filter-btn ${orderFilter === 'toShip' ? 'active' : ''}`}
        onClick={() => setOrderFilter('toShip')}
      >
        To Ship ({getOrderCountByStatus('toShip')})
      </button>
      <button 
        className={`filter-btn ${orderFilter === 'toReceive' ? 'active' : ''}`}
        onClick={() => setOrderFilter('toReceive')}
      >
        To Receive ({getOrderCountByStatus('toReceive')})
      </button>
      <button 
        className={`filter-btn ${orderFilter === 'completed' ? 'active' : ''}`}
        onClick={() => setOrderFilter('completed')}
      >
        Completed ({getOrderCountByStatus('completed')})
      </button>
      <button 
        className={`filter-btn ${orderFilter === 'cancelled' ? 'active' : ''}`}
        onClick={() => setOrderFilter('cancelled')}
      >
        Cancelled ({getOrderCountByStatus('cancelled')})
      </button>
      <button 
        className={`filter-btn ${orderFilter === 'returnRefund' ? 'active' : ''}`}
        onClick={() => setOrderFilter('returnRefund')}
      >
        Return/Refund ({getOrderCountByStatus('returnRefund')})
      </button>
    </div>
  );

  // ========== RENDERING ==========

  if (!currentUser) {
    return (
      <div className="profile-page">
        <div className="profile-hero">
          <div className="container">
            <div className="profile-hero-content">
              <h1>User Profile</h1>
              <p>Manage your account and track your orders</p>
            </div>
          </div>
          <div className="profile-hero-wave">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="shape-fill"></path>
            </svg>
          </div>
        </div>

        <div className="container">
          <div className="profile-container">
            <div className="not-logged-in">
              <div className="not-logged-in-icon">
                <i className="fas fa-user-lock"></i>
              </div>
              <h2>Authentication Required</h2>
              <p>Please log in to access your personal profile dashboard, order history, and account settings.</p>
              <div className="auth-buttons">
                <button 
                  className="btn-primary" 
                  onClick={() => openAuthModal('login')}
                >
                  <i className="fas fa-sign-in-alt"></i>
                  Sign In to Your Account
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={() => navigate('/')}
                >
                  <i className="fas fa-arrow-left"></i>
                  Return to Homepage
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredOrders = getFilteredOrders();

  return (
    <div className="profile-page">
      {/* Back to Home Button */}
      <div className="profile-header-actions">
        <div className="container">
          <button 
            className="back-to-home-btn"
            onClick={() => navigate('/')}
          >
            <i className="fas fa-arrow-left"></i>
            Back to Home
          </button>
        </div>
      </div>

      {/* Header Section */}
      <div className="profile-hero">
        <div className="container">
          <div className="profile-hero-content">
            <div className="profile-avatar">
              <div className="avatar-circle">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'D'}
              </div>
              <div className="online-indicator"></div>
            </div>
            <div className="profile-hero-text">
              <h1>Welcome back, {currentUser.name || 'DRIFTWEAR'}!</h1>
              <p>Here's your personal dashboard where you can manage your account, track orders, and update preferences.</p>
              <div className="profile-meta">
                <span className="meta-item">
                  <i className="fas fa-shopping-bag"></i>
                  {userStats.orders} Orders
                </span>
                <span className="meta-item">
                  <i className="fas fa-user"></i>
                  Member since {currentUser.createdAt ? formatDate(currentUser.createdAt) : 'Recently'}
                </span>
                <span className="meta-item">
                  <i className="fas fa-envelope"></i>
                  {currentUser.email || 'driftwear@gmail.com'}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="profile-hero-wave">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="shape-fill"></path>
          </svg>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="profile-nav">
        <div className="container">
          <nav className="profile-tabs">
            <button 
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <i className="fas fa-chart-pie"></i>
              Overview
            </button>
            <button 
              className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <i className="fas fa-shopping-bag"></i>
              Orders ({userStats.orders})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'wishlist' ? 'active' : ''}`}
              onClick={() => navigate('/wishlist')}
            >
              <i className="fas fa-heart"></i>
              Wishlist ({userStats.wishlistItems})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <i className="fas fa-cog"></i>
              Settings
            </button>
          </nav>
        </div>
      </div>

      <div className="container">
        <div className="profile-container">
          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <div className="profile-content">
              {/* Left Column - Personal Info & Quick Actions */}
              <div className="profile-main">
                {/* Personal Information Card */}
                <div className="profile-card">
                  <div className="card-header">
                    <h3><i className="fas fa-user-circle"></i> Personal Information</h3>
                  </div>
                  <div className="card-body">
                    <div className="info-grid">
                      <div className="info-field">
                        <label>Full Name</label>
                        <div className="info-value">{currentUser.name || 'DRIFTWEAR'}</div>
                      </div>
                      <div className="info-field">
                        <label>Email Address</label>
                        <div className="info-value">{currentUser.email || 'driftwear@gmail.com'}</div>
                      </div>
                      <div className="info-field">
                        <label>User ID</label>
                        <div className="info-value code">{currentUser.id || '176883564858'}</div>
                      </div>
                      <div className="info-field">
                        <label>Account Status</label>
                        <div className="info-value status">
                          <i className="fas fa-check-circle"></i>
                          Verified Account
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions Card */}
                <div className="profile-card">
                  <div className="card-header">
                    <h3><i className="fas fa-bolt"></i> Quick Actions</h3>
                  </div>
                  <div className="card-body">
                    <div className="actions-grid">
                      <button className="action-btn primary" onClick={() => setActiveTab('orders')}>
                        <i className="fas fa-shopping-bag"></i>
                        <span>View Orders ({userStats.orders})</span>
                      </button>
                      <button className="action-btn" onClick={() => navigate('/wishlist')}>
                        <i className="fas fa-heart"></i>
                        <span>My Wishlist ({userStats.wishlistItems})</span>
                      </button>
                      <button className="action-btn" onClick={() => navigate('/cart')}>
                        <i className="fas fa-shopping-cart"></i>
                        <span>Shopping Cart ({userStats.cartItems})</span>
                      </button>
                      <button className="action-btn" onClick={handleContactSupport}>
                        <i className="fas fa-headset"></i>
                        <span>Contact Support</span>
                      </button>
                      <button className="action-btn" onClick={handleViewMessages}>
                        <i className="fas fa-comments"></i>
                        <span>
                          My Messages 
                          {getUnreadCount() > 0 && (
                            <span className="message-badge">{getUnreadCount()}</span>
                          )}
                        </span>
                      </button>
                      <button className="action-btn outline" onClick={() => navigate('/products')}>
                        <i className="fas fa-store"></i>
                        <span>Continue Shopping</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Stats & Activity */}
              <div className="profile-sidebar">
                {/* Account Stats Card */}
                <div className="profile-card">
                  <div className="card-header">
                    <h3><i className="fas fa-chart-bar"></i> Account Stats</h3>
                  </div>
                  <div className="card-body">
                    <div className="stats-grid">
                      <div className="stat-card">
                        <div className="stat-icon orders">
                          <i className="fas fa-box"></i>
                        </div>
                        <div className="stat-info">
                          <div className="stat-number">{userStats.orders}</div>
                          <div className="stat-label">Total Orders</div>
                        </div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-icon wishlist">
                          <i className="fas fa-heart"></i>
                        </div>
                        <div className="stat-info">
                          <div className="stat-number">{userStats.wishlistItems}</div>
                          <div className="stat-label">Wishlist Items</div>
                        </div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-icon cart">
                          <i className="fas fa-shopping-cart"></i>
                        </div>
                        <div className="stat-info">
                          <div className="stat-number">{userStats.cartItems}</div>
                          <div className="stat-label">Cart Items</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Orders Preview */}
                {userOrders.length > 0 && (
                  <div className="profile-card">
                    <div className="card-header">
                      <h3><i className="fas fa-clock"></i> Recent Orders</h3>
                    </div>
                    <div className="card-body">
                      <div className="recent-orders">
                        {userOrders.slice(0, 3).map((order) => (
                          <div key={order.id} className="recent-order">
                            <div className="recent-order-info">
                              <strong>{order.orderNumber || `#${order.id.slice(-8)}`}</strong>
                              <span className="recent-order-date">{formatDate(order.createdAt)}</span>
                            </div>
                            <div className="recent-order-status">
                              <span 
                                className="status-dot"
                                style={{ backgroundColor: getStatusColor(order) }}
                              ></span>
                              {getStatusText(order)}
                            </div>
                          </div>
                        ))}
                      </div>
                      {userOrders.length > 3 && (
                        <button 
                          className="view-all-orders"
                          onClick={() => setActiveTab('orders')}
                        >
                          View All Orders ({userOrders.length})
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Quick Settings Card */}
                <div className="profile-card">
                  <div className="card-header">
                    <h3><i className="fas fa-cog"></i> Quick Settings</h3>
                  </div>
                  <div className="card-body">
                    <div className="settings-list">
                      <button className="setting-item">
                        <i className="fas fa-user-edit"></i>
                        <span>Edit Profile</span>
                        <i className="fas fa-chevron-right"></i>
                      </button>
                      <button className="setting-item">
                        <i className="fas fa-lock"></i>
                        <span>Change Password</span>
                        <i className="fas fa-chevron-right"></i>
                      </button>
                      <button className="setting-item">
                        <i className="fas fa-bell"></i>
                        <span>Notifications</span>
                        <i className="fas fa-chevron-right"></i>
                      </button>
                      <button className="setting-item" onClick={handleContactSupport}>
                        <i className="fas fa-headset"></i>
                        <span>Contact Support</span>
                        <i className="fas fa-chevron-right"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab Content */}
          {activeTab === 'orders' && (
            <div className="orders-tab">
              <div className="orders-header">
                <h2>Order History</h2>
                <p>View and track your recent purchases</p>
              </div>
              
              {/* Contact Support Button in Orders Tab */}
              <div className="support-section">
                <h3>Need help with your orders?</h3>
                <p>Our support team is here to help you with any questions or issues.</p>
                <button 
                  className="btn-primary"
                  onClick={handleContactSupport}
                >
                  <i className="fas fa-headset"></i>
                  Contact Support
                </button>
              </div>
              
              {/* Order Filter Buttons */}
              <OrderFilterButtons />
                    
              {loading ? (
                <div className="loading-orders">
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>Loading your orders...</p>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="no-orders">
                  <div className="no-orders-icon">
                    <i className="fas fa-shopping-bag"></i>
                  </div>
                  <h3>No {getFilterDisplayName(orderFilter).toLowerCase()}</h3>
                  <p>
                    {orderFilter === 'all' 
                      ? "You haven't placed any orders yet. Start shopping to see your order history here."
                      : `You don't have any ${getFilterDisplayName(orderFilter).toLowerCase()} at the moment.`
                    }
                  </p>
                  {orderFilter !== 'all' && (
                    <button 
                      className="btn-outline" 
                      onClick={() => setOrderFilter('all')}
                    >
                      View All Orders
                    </button>
                  )}
                  <button 
                    className="btn-primary" 
                    onClick={() => navigate('/products')}
                  >
                    <i className="fas fa-store"></i>
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="orders-list">
                  <div className="orders-filter-info">
                    <h3>{getFilterDisplayName(orderFilter)} ({filteredOrders.length})</h3>
                  </div>
                  {filteredOrders.map((order) => (
                    <div key={order.id} className="order-card">
                      <div className="order-header">
                        <div className="order-info">
                          <h4>Order {order.orderNumber || `#${order.id.slice(-8)}`}</h4>
                          <span className="order-date">Placed on {formatDate(order.createdAt || order.orderDate)}</span>
                          {order.paymentDate && (
                            <span className="order-date paid-date">
                              <i className="fas fa-check-circle"></i>
                              Paid on {formatDate(order.paymentDate)}
                            </span>
                          )}
                          {order.shippedAt && (
                            <span className="order-date">Shipped on {formatDate(order.shippedAt)}</span>
                          )}
                          {order.deliveredAt && (
                            <span className="order-date">Delivered on {formatDate(order.deliveredAt)}</span>
                          )}
                          {order.cancelledAt && (
                            <span className="cancelled-date">Cancelled on {formatDate(order.cancelledAt)}</span>
                          )}
                          {order.returnRequestedAt && (
                            <span className="cancelled-date">Return requested on {formatDate(order.returnRequestedAt)}</span>
                          )}
                          
                          {/* Payment Method Display */}
                          <div className="order-payment-method">
                            <i className="fas fa-credit-card"></i>
                            {getPaymentMethodDisplay(order)} • {getPaymentStatusText(order)}
                          </div>
                        </div>
                        <div className="order-status">
                          <span 
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(order) }}
                          >
                            {getStatusText(order)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="order-items">
                        {order.items && order.items.map((item, index) => (
                          <div key={index} className="order-item">
                            <img 
                              src={item.image || 'https://via.placeholder.com/60'} 
                              alt={item.name}
                              className="item-image"
                            />
                            <div className="item-details">
                              <h5>{item.name}</h5>
                              <div className="item-meta">
                                <span className="item-price">
                                  {formatPrice ? formatPrice(item.price) : `$${item.price}`}
                                </span>
                                <span className="item-quantity">Qty: {item.quantity || 1}</span>
                                {item.size && (
                                  <span className="item-size">Size: {item.size}</span>
                                )}
                                {item.color && (
                                  <span className="item-color">Color: {item.color}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="order-footer">
                        <div className="order-total">
                          <strong>Total: {formatPrice ? formatPrice(order.totalAmount || order.total) : `$${order.totalAmount || order.total}`}</strong>
                        </div>
                        <div className="order-actions">
                          <button 
                            className="btn-outline"
                            onClick={() => navigate(`/order-confirmation/${order.id}`)}
                          >
                            <i className="fas fa-eye"></i>
                            View Details
                          </button>
                          
                          {/* Contact Support for this order */}
                          <button 
                            className="btn-outline"
                            onClick={() => {
                              setContactForm(prev => ({
                                ...prev,
                                subject: `Help with Order ${order.orderNumber || order.id}`,
                                orderId: order.orderNumber || order.id
                              }));
                              setShowContactModal(true);
                            }}
                          >
                            <i className="fas fa-headset"></i>
                            Get Help
                          </button>
                          
                          
                          
                          {/* Reorder Button for completed orders */}
                          {order.status === 'delivered' && (
                            <button 
                              className="btn-outline"
                              onClick={() => {
                                // Add all items from this order to cart
                                if (order.items && order.items.length > 0) {
                                  try {
                                    const cartKey = `driftwear_cart_${currentUser.id}`;
                                    const currentCart = JSON.parse(localStorage.getItem(cartKey) || '[]');
                                    
                                    // Add each item from the order to cart
                                    order.items.forEach(item => {
                                      currentCart.push({
                                        ...item,
                                        quantity: 1 // Reset quantity to 1 for reorder
                                      });
                                    });
                                    
                                    localStorage.setItem(cartKey, JSON.stringify(currentCart));
                                    alert('Items added to cart!');
                                    navigate('/cart');
                                  } catch (error) {
                                    console.error('Error reordering:', error);
                                    alert('Failed to reorder items.');
                                  }
                                }
                              }}
                            >
                              <i className="fas fa-redo"></i>
                              Reorder
                            </button>
                          )}
                          
                          {/* Return/Refund Button for delivered orders */}
                          {canRequestReturn(order) && (
                            <button 
                              className="btn-outline"
                              onClick={() => requestReturnRefund(order.id)}
                            >
                              <i className="fas fa-undo"></i>
                              Request Return
                            </button>
                          )}
                          
                          {/* Cancel Order Button */}
                          {canCancelOrder(order) && (
                            <button 
                              className="btn-cancel"
                              onClick={() => cancelOrder(order.id)}
                              disabled={cancellingOrder === order.id}
                            >
                              {cancellingOrder === order.id ? (
                                <i className="fas fa-spinner fa-spin"></i>
                              ) : (
                                <i className="fas fa-times"></i>
                              )}
                              {cancellingOrder === order.id ? 'Cancelling...' : 'Cancel Order'}
                            </button>
                          )}
                          
                          {/* Cancellation Info Message */}
                          {!canCancelOrder(order) && order.status !== 'cancelled' && (
                            <div className="cancellation-info">
                              <i className="fas fa-info-circle"></i>
                              <span>{getCancellationMessage(order)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings Tab Content */}
          {activeTab === 'settings' && (
            <div className="settings-tab">
              <div className="settings-header">
                <h2>Account Settings</h2>
                <p>Manage your account preferences and security settings</p>
              </div>
              <div className="settings-content">
                <div className="settings-grid">
                  <div className="setting-option" onClick={() => console.log('Edit Profile clicked')}>
                    <i className="fas fa-user-edit"></i>
                    <h4>Edit Profile</h4>
                    <p>Update your personal information</p>
                  </div>
                  <div className="setting-option" onClick={() => console.log('Change Password clicked')}>
                    <i className="fas fa-lock"></i>
                    <h4>Change Password</h4>
                    <p>Update your account password</p>
                  </div>
                  <div className="setting-option" onClick={() => console.log('Notifications clicked')}>
                    <i className="fas fa-bell"></i>
                    <h4>Notifications</h4>
                    <p>Manage your notification preferences</p>
                  </div>
                  <div className="setting-option" onClick={handleContactSupport}>
                    <i className="fas fa-headset"></i>
                    <h4>Contact Support</h4>
                    <p>Get help with your account or orders</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contact Support Modal */}
      {showContactModal && (
        <div className="modal" onClick={() => setShowContactModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <span className="modal-close" onClick={() => setShowContactModal(false)}>&times;</span>
            
            <div className="modal-header">
              <h2>Contact Support</h2>
              <p>We're here to help! Send us a message and we'll respond as soon as possible.</p>
            </div>

            <form onSubmit={handleContactSubmit}>
              <div className="form-group">
                <label>Subject *</label>
                <input
                  type="text"
                  name="subject"
                  value={contactForm.subject}
                  onChange={handleContactChange}
                  required
                  placeholder="What is this regarding?"
                />
              </div>

              <div className="form-group">
                <label>Priority</label>
                <select
                  name="priority"
                  value={contactForm.priority}
                  onChange={handleContactChange}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="form-group">
                <label>Order Number (Optional)</label>
                <input
                  type="text"
                  name="orderId"
                  value={contactForm.orderId}
                  onChange={handleContactChange}
                  placeholder="If related to an order, enter order number"
                />
              </div>

              <div className="form-group">
                <label>Message *</label>
                <textarea
                  name="message"
                  value={contactForm.message}
                  onChange={handleContactChange}
                  required
                  rows="6"
                  placeholder="Please describe your inquiry in detail..."
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-outline"
                  onClick={() => setShowContactModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                >
                  <i className="fas fa-paper-plane"></i>
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Messenger Modal */}
      {showMessagesModal && (
        <div className="modal" onClick={() => setShowMessagesModal(false)}>
          <div className="modal-content messenger-modal" onClick={(e) => e.stopPropagation()}>
            <span className="modal-close" onClick={() => setShowMessagesModal(false)}>&times;</span>
            
            <div className="messenger-header">
              <h2>My Messages</h2>
              <button 
                className="btn-primary btn-sm"
                onClick={() => {
                  setShowMessagesModal(false);
                  setShowContactModal(true);
                }}
              >
                <i className="fas fa-plus"></i>
                New Conversation
              </button>
            </div>

            <div className="messenger-container">
              {/* Conversations List */}
              <div className="conversations-list">
                <h4>Conversations</h4>
                {userMessages.length === 0 ? (
                  <div className="no-conversations">
                    <i className="fas fa-comments"></i>
                    <p>No messages yet</p>
                    <button 
                      className="btn-primary"
                      onClick={() => {
                        setShowMessagesModal(false);
                        setShowContactModal(true);
                      }}
                    >
                      Start a Conversation
                    </button>
                  </div>
                ) : (
                  userMessages.map(message => (
                    <div
                      key={message.id}
                      className={`conversation-item ${selectedConversation?.id === message.id ? 'active' : ''} ${message.status}`}
                      onClick={() => selectConversation(message)}
                    >
                      <div className="conversation-preview">
                        <h5>{message.subject}</h5>
                        <p className="conversation-excerpt">
                          {message.replies.length > 0 
                            ? message.replies[message.replies.length - 1].message
                            : message.message
                          }
                        </p>
                        <span className="conversation-date">
                          {formatDate(message.replies.length > 0 
                            ? message.replies[message.replies.length - 1].timestamp
                            : message.timestamp
                          )}
                        </span>
                      </div>
                      {message.status === 'unread' && (
                        <span className="unread-indicator"></span>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Chat Area */}
              <div className="chat-area">
                {selectedConversation ? (
                  <>
                    <div className="chat-header">
                      <h3>{selectedConversation.subject}</h3>
                      <span className="chat-status">
                        {selectedConversation.status === 'unread' ? 'Unread' : 'Read'}
                      </span>
                    </div>

                    <div className="messages-container">
                      {/* Original Message */}
                      <div className="message-bubble user-message">
                        <div className="message-sender">{selectedConversation.userName}</div>
                        <div className="message-content">{selectedConversation.message}</div>
                        <div className="message-time">{formatDate(selectedConversation.timestamp)}</div>
                      </div>

                      {/* Replies */}
                      {selectedConversation.replies.map((reply) => (
                        <div 
                          key={reply.id} 
                          className={`message-bubble ${reply.senderType === 'admin' ? 'admin-message' : 'user-message'}`}
                        >
                          <div className="message-sender">
                            {reply.senderType === 'admin' ? 'Admin' : reply.senderName}
                          </div>
                          <div className="message-content">{reply.message}</div>
                          <div className="message-time">{formatDate(reply.timestamp)}</div>
                        </div>
                      ))}
                    </div>

                    <div className="message-input-container">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        rows="3"
                      />
                      <button 
                        className="btn-primary"
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                      >
                        <i className="fas fa-paper-plane"></i>
                        Send
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="no-conversation-selected">
                    <i className="fas fa-comment-alt"></i>
                    <h3>Select a conversation</h3>
                    <p>Choose a conversation from the list to view messages</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfile;