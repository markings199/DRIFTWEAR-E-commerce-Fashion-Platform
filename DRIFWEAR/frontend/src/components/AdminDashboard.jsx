import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import adminService from '../services/admin.service';
import { messageService } from '../services/message.service';
import AdminOrders from './AdminOrders';
import AdminUsers from './AdminUsers';
import AdminProducts from './AdminProducts';
import AdminMessages from './AdminMessages';
import AdminCustomDesigns from './AdminCustomDesigns';
import '../css/AdminDashboard.css';

const AdminDashboard = ({ adminUser, onAdminLogout, getAllOrdersForAdmin, getAdminStatistics }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // ========== PAYMENT STATUS FUNCTIONS ==========
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
    if (order.paymentStatus === 'pending') return 'Paid'; // Changed from 'Paid & Processing'
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
    
    return 'Paid'; // Changed default to Paid
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
      if (orderStatus === 'pending_payment') return 'Processing'; // Changed this line
      return 'Processing';
    }
    
    if (orderStatus === 'pending' && order.paymentMethod === 'cod') {
      return 'Pending (COD)';
    }
    
    const statusMap = {
      'processing': 'Processing',
      'pending_payment': 'Processing', // Changed from 'Pending Payment' to 'Processing'
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

  const isOrderPaid = (order) => {
    // Check various indicators of payment
    return order.paymentStatus === 'paid' || 
           order.paymentStatus === 'pending' || // pending now means paid
           order.paymentMethod?.toLowerCase().includes('gcash') ||
           order.paymentMethod?.toLowerCase().includes('paymaya') ||
           order.paymentMethod?.toLowerCase().includes('card') ||
           order.paymentMethod?.toLowerCase().includes('paymongo') ||
           order.paymongoSessionId || 
           order.paymongoData ||
           (order.transactionId && order.transactionId.startsWith('TXN')) ||
           (order.transactionId && order.transactionId.startsWith('DEMO_TXN'));
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
    if (order.paymentStatus === 'paid' || order.paymentStatus === 'pending') return '#4CAF50'; // Green for paid
    if (order.paymentStatus === 'failed') return '#F44336'; // Red for failed
    
    // Check for PayMongo payments
    if (order.paymongoSessionId || order.paymongoData) {
      return '#4CAF50'; // Green for PayMongo payments
    }
    
    // Check order status
    const status = order.status || 'pending';
    switch (status) {
      case 'delivered': return '#4CAF50';
      case 'shipped': return '#2196F3';
      case 'processing': return '#FF9800';
      case 'cancelled': return '#F44336';
      case 'pending': 
        return order.paymentMethod === 'cod' ? '#FF9800' : '#4CAF50'; // Green for online payments
      case 'pending_payment': return '#4CAF50'; // Changed to green
      case 'return_requested': return '#9C27B0';
      case 'refunded': return '#607D8B';
      default: return '#4CAF50';
    }
  };
  // ========== END PAYMENT STATUS FUNCTIONS ==========

  useEffect(() => {
    const checkAdminAuth = () => {
      const adminData = localStorage.getItem('driftwear_admin');
      if (!adminData) {
        navigate('/admin/login');
        return false;
      }
      return true;
    };

    if (!checkAdminAuth()) {
      return;
    }

    // Initialize sample messages if empty
    messageService.initializeSampleData();
    
    loadDashboardData();
  }, [navigate]);

  useEffect(() => {
    const path = location.pathname;
    console.log('Current path:', path);
    
    if (path.includes('/admin/orders')) setActiveSection('orders');
    else if (path.includes('/admin/users')) setActiveSection('users');
    else if (path.includes('/admin/products')) setActiveSection('products');
    else if (path.includes('/admin/messages')) setActiveSection('messages');
    else if (path.includes('/admin/designs')) setActiveSection('designs');
    else if (path === '/admin' || path === '/admin/') setActiveSection('dashboard');
    else setActiveSection('dashboard');
  }, [location]);

  // ============ UPDATED: Get ALL orders from ALL sources ============
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
                            (order.paymentMethod === 'cod' ? 'pending_cod' : 'paid'), // Default to paid for online
              orderNumber: order.orderNumber || `#${order.id?.slice(-8) || '00000000'}`,
              total: order.total || order.totalAmount || 0,
              createdAt: order.createdAt || order.orderDate || new Date().toISOString(),
              itemsRemoved: order.itemsRemoved || false
            });
          } else {
            // Update existing order with user info if missing
            allOrders[existingIndex] = {
              ...allOrders[existingIndex],
              customerId: user.id,
              customerName: user.name || allOrders[existingIndex].customerName || 'Unknown Customer',
              customerEmail: user.email || allOrders[existingIndex].customerEmail || 'unknown@email.com'
            };
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
        } else {
          allOrders[existingIndex] = lastOrder;
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
        } else {
          allOrders[existingIndex] = demoOrder;
        }
      }
      
      // 6. Check for any orders with online payments
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.includes('payment') || key.includes('order') || key.includes('checkout') || key.includes('gcash')) {
          try {
            const data = JSON.parse(localStorage.getItem(key));
            if (data && data.id && data.paymentMethod) {
              // Check if it's an online payment
              const isOnlinePayment = data.paymentMethod && 
                (data.paymentMethod.toLowerCase().includes('gcash') || 
                 data.paymentMethod.toLowerCase().includes('paymaya') || 
                 data.paymentMethod.toLowerCase().includes('card') ||
                 data.paymentMethod.toLowerCase().includes('paymongo'));
              
              if (isOnlinePayment) {
                const orderIndex = allOrders.findIndex(o => o.id === data.id);
                if (orderIndex === -1 && data.id.startsWith('ORD')) {
                  console.log('Found online payment order:', key, data.id);
                  // Auto-set as paid
                  data.paymentStatus = 'paid';
                  data.status = 'processing';
                  allOrders.push({
                    ...data,
                    customerId: data.customerId || 'guest',
                    customerName: data.customerName || 'Guest Customer',
                    customerEmail: data.customerEmail || 'guest@email.com'
                  });
                } else if (orderIndex !== -1) {
                  // Update existing order
                  allOrders[orderIndex].paymentStatus = 'paid';
                  allOrders[orderIndex].status = 'processing';
                }
              }
            }
          } catch (e) {
            // Not JSON, skip
          }
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

  // ============ Load ALL users ============
  const getAllUsers = () => {
    try {
      const users = JSON.parse(localStorage.getItem('driftwear_users') || '[]');
      
      // Add guest users from orders
      const allOrders = getAllOrdersFromGlobal();
      const guestUsersMap = new Map();
      
      allOrders.forEach(order => {
        if (order.customerId === 'guest' || !order.customerId || !users.find(u => u.id === order.customerId)) {
          const guestKey = order.customerEmail || 'guest@email.com';
          if (!guestUsersMap.has(guestKey)) {
            guestUsersMap.set(guestKey, {
              id: 'guest_' + (order.customerEmail || Date.now()),
              name: order.customerName || 'Guest Customer',
              email: order.customerEmail || 'guest@email.com',
              isGuest: true,
              createdAt: order.createdAt || new Date().toISOString()
            });
          }
        }
      });
      
      const guestUsersArray = Array.from(guestUsersMap.values());
      
      return [...users, ...guestUsersArray];
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  };

  // ============ Load dashboard data ============
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get real unread message count
      const unreadMessages = messageService.getUnreadCount();
      
      // Load custom designs
      const customDesigns = JSON.parse(localStorage.getItem('driftwear_custom_designs') || '[]');
      const pendingDesigns = customDesigns.filter(design => design.status === 'pending').length;
      
      // Get ALL orders
      const allOrdersData = getAllOrdersFromGlobal();
      setAllOrders(allOrdersData);
      
      console.log('📊 Total orders found for admin:', allOrdersData.length);
      if (allOrdersData.length > 0) {
        console.log('Sample order:', {
          id: allOrdersData[0].id,
          orderNumber: allOrdersData[0].orderNumber,
          customer: allOrdersData[0].customerName,
          status: allOrdersData[0].status,
          paymentStatus: allOrdersData[0].paymentStatus,
          paymentMethod: allOrdersData[0].paymentMethod,
          total: allOrdersData[0].total
        });
      }
      
      // Get ALL users
      const allUsersData = getAllUsers();
      setAllUsers(allUsersData);
      
      // Calculate statistics
      const pendingOrders = allOrdersData.filter(order => 
        order.paymentMethod === 'cod' && 
        (order.status === 'pending' || order.paymentStatus === 'pending_cod')
      ).length;
      
      const paidOrders = allOrdersData.filter(order => 
        order.paymentStatus === 'paid' || 
        (order.paymentMethod && 
         (order.paymentMethod.toLowerCase().includes('gcash') || 
          order.paymentMethod.toLowerCase().includes('paymaya') || 
          order.paymentMethod.toLowerCase().includes('card') ||
          order.paymentMethod.toLowerCase().includes('paymongo')))
      ).length;
      
      const processingOrders = allOrdersData.filter(order => 
        order.status === 'processing'
      ).length;
      
      const deliveredOrders = allOrdersData.filter(order => 
        order.status === 'delivered'
      ).length;
      
      const cancelledOrders = allOrdersData.filter(order => 
        order.status === 'cancelled'
      ).length;
      
      // Calculate total sales from PAID orders only
      const totalSales = allOrdersData
        .filter(order => order.paymentStatus === 'paid' || 
          (order.paymentMethod && 
           (order.paymentMethod.toLowerCase().includes('gcash') || 
            order.paymentMethod.toLowerCase().includes('paymaya') || 
            order.paymentMethod.toLowerCase().includes('card') ||
            order.paymentMethod.toLowerCase().includes('paymongo'))))
        .reduce((total, order) => total + (parseFloat(order.total) || parseFloat(order.totalAmount) || 0), 0);
      
      // Calculate today's sales
      const today = new Date();
      const todaySales = allOrdersData
        .filter(order => {
          const isPaid = order.paymentStatus === 'paid' || 
            (order.paymentMethod && 
             (order.paymentMethod.toLowerCase().includes('gcash') || 
              order.paymentMethod.toLowerCase().includes('paymaya') || 
              order.paymentMethod.toLowerCase().includes('card') ||
              order.paymentMethod.toLowerCase().includes('paymongo')));
          if (!isPaid) return false;
          const orderDate = new Date(order.createdAt || order.orderDate);
          return orderDate.toDateString() === today.toDateString();
        })
        .reduce((total, order) => total + (parseFloat(order.total) || parseFloat(order.totalAmount) || 0), 0);
      
      setStats({
        totalSales: totalSales,
        todaySales: todaySales,
        totalOrders: allOrdersData.length,
        totalCustomers: allUsersData.length,
        pendingOrders: pendingOrders,
        paidOrders: paidOrders,
        processingOrders: processingOrders,
        deliveredOrders: deliveredOrders,
        cancelledOrders: cancelledOrders,
        unreadMessages: unreadMessages,
        lowStockProducts: 0,
        customDesigns: customDesigns.length,
        pendingDesigns: pendingDesigns
      });
      
      // Get recent orders (last 5)
      const recentOrdersData = allOrdersData
        .slice(0, 5)
        .map(order => {
          // Auto-set online payments as paid
          const isOnlinePayment = order.paymentMethod && 
            (order.paymentMethod.toLowerCase().includes('gcash') || 
             order.paymentMethod.toLowerCase().includes('paymaya') || 
             order.paymentMethod.toLowerCase().includes('card') ||
             order.paymentMethod.toLowerCase().includes('paymongo'));
          
          let paymentStatus = order.paymentStatus;
          let status = order.status;
          
          if (isOnlinePayment) {
            paymentStatus = 'paid';
            if (status === 'pending' || status === 'pending_payment') {
              status = 'processing';
            }
          }
          
          return {
            id: order.id,
            orderNumber: order.orderNumber || `#${order.id?.slice(-8) || '000000'}`,
            customer: order.customerName || 'Unknown Customer',
            customerEmail: order.customerEmail || 'unknown@email.com',
            amount: parseFloat(order.total) || parseFloat(order.totalAmount) || 0,
            status: status,
            paymentMethod: order.paymentMethod || order.originalPaymentMethod || 'cod',
            paymentStatus: paymentStatus || 
                         (order.paymentMethod === 'cod' ? 'pending_cod' : 'paid'),
            date: order.createdAt || order.orderDate || new Date().toISOString(),
            items: order.items || [],
            shippingAddress: order.shippingAddress || {}
          };
        });
      
      setRecentOrders(recentOrdersData.length > 0 ? recentOrdersData : getSampleOrders());
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Error loading dashboard data. Please refresh the page.');
      const customDesigns = JSON.parse(localStorage.getItem('driftwear_custom_designs') || '[]');
      const pendingDesigns = customDesigns.filter(design => design.status === 'pending').length;
      
      setStats({
        totalSales: 0,
        todaySales: 0,
        totalOrders: 0,
        totalCustomers: 0,
        pendingOrders: 0,
        paidOrders: 0,
        processingOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        unreadMessages: messageService.getUnreadCount(),
        lowStockProducts: 0,
        customDesigns: customDesigns.length,
        pendingDesigns: pendingDesigns
      });
      setRecentOrders(getSampleOrders());
      setAllOrders([]);
      setAllUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const getSampleOrders = () => {
    return [
      {
        id: 'ORD001',
        orderNumber: '#63104643',
        customer: 'John Doe',
        customerEmail: 'john@example.com',
        amount: 79.99,
        status: 'processing',
        paymentMethod: 'gcash',
        paymentStatus: 'paid',
        date: new Date().toISOString(),
        items: [{ name: 'Hooded Jacket', price: 79.99, quantity: 1 }],
        shippingAddress: { address: '123 Main St', city: 'Manila' }
      },
      {
        id: 'ORD002',
        orderNumber: '#63104644',
        customer: 'Jane Smith',
        customerEmail: 'jane@example.com',
        amount: 129.99,
        status: 'processing',
        paymentMethod: 'gcash',
        paymentStatus: 'paid', // Changed from 'pending' to 'paid'
        date: new Date(Date.now() - 86400000).toISOString(),
        items: [{ name: 'Premium T-Shirt', price: 29.99, quantity: 1 }, { name: 'Jeans', price: 50.00, quantity: 2 }],
        shippingAddress: { address: '456 Oak Ave', city: 'Quezon City' }
      },
      {
        id: 'ORD003',
        orderNumber: '#63104645',
        customer: 'Mike Johnson',
        customerEmail: 'mike@example.com',
        amount: 45.99,
        status: 'delivered',
        paymentMethod: 'cod',
        paymentStatus: 'pending_cod',
        date: new Date(Date.now() - 172800000).toISOString(),
        items: [{ name: 'Cap', price: 24.99, quantity: 1 }, { name: 'Socks', price: 21.00, quantity: 1 }],
        shippingAddress: { address: '789 Pine Rd', city: 'Makati' }
      }
    ];
  };

  const navigateToSection = (section) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
    if (section === 'dashboard') {
      navigate('/admin');
    } else {
      navigate(`/admin/${section}`);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date Error';
    }
  };

  const handleLogout = () => {
    if (onAdminLogout) {
      onAdminLogout();
    }
    localStorage.removeItem('driftwear_admin');
    navigate('/admin/login');
  };

  const getPaymentMethodDisplay = (method) => {
    const methods = {
      'cod': 'Cash on Delivery',
      'gcash': 'GCash',
      'paymaya': 'PayMaya',
      'card': 'Credit/Debit Card',
      'paymongo_online': 'Online Payment',
      'paymongo_gcash': 'GCash (via PayMongo)',
      'paymongo_paymaya': 'PayMaya (via PayMongo)',
      'paymongo_card': 'Card (via PayMongo)'
    };
    return methods[method] || method;
  };

  const getPaymentStatusColor = (status, paymentMethod) => {
    // For online payments, always show green
    if (paymentMethod && 
        (paymentMethod.toLowerCase().includes('gcash') || 
         paymentMethod.toLowerCase().includes('paymaya') || 
         paymentMethod.toLowerCase().includes('card') ||
         paymentMethod.toLowerCase().includes('paymongo'))) {
      return '#4CAF50'; // Green for online payments
    }
    
    const colors = {
      'paid': '#4CAF50',
      'pending': '#4CAF50', // Green for pending online payments
      'pending_cod': '#FF9800',
      'failed': '#F44336',
      'cancelled': '#F44336'
    };
    
    return colors[status?.toLowerCase()] || '#4CAF50'; // Default to green
  };

  // ============ Render dashboard ============
  const renderDashboard = () => (
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Welcome back, {adminUser?.name || 'Admin'}! Here's what's happening with your store today.</p>
        
        {error && (
          <div className="error-message">
            <i className="fas fa-exclamation-triangle"></i>
            {error}
            <button onClick={loadDashboardData} className="btn-retry">
              <i className="fas fa-redo"></i>
              Retry
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card sales">
              <div className="stat-icon sales">
                <i className="fas fa-chart-line"></i>
              </div>
              <div className="stat-info">
                <div className="stat-number">{formatPrice(stats.totalSales || 0)}</div>
                <div className="stat-label">Total Revenue</div>
                <div className="stat-trend trend-up">
                  <i className="fas fa-arrow-up"></i>
                  <span>Today: {formatPrice(stats.todaySales || 0)}</span>
                </div>
              </div>
            </div>

            <div className="stat-card orders">
              <div className="stat-icon orders">
                <i className="fas fa-shopping-bag"></i>
              </div>
              <div className="stat-info">
                <div className="stat-number">{stats.totalOrders || 0}</div>
                <div className="stat-label">Total Orders</div>
                <div className="stat-trend trend-up">
                  <i className="fas fa-arrow-up"></i>
                  <span>{stats.paidOrders || 0} paid</span>
                </div>
              </div>
            </div>

            <div className="stat-card customers">
              <div className="stat-icon customers">
                <i className="fas fa-users"></i>
              </div>
              <div className="stat-info">
                <div className="stat-number">{stats.totalCustomers || 0}</div>
                <div className="stat-label">Total Customers</div>
                <div className="stat-trend trend-up">
                  <i className="fas fa-arrow-up"></i>
                  <span>All active customers</span>
                </div>
              </div>
            </div>

            <div className="stat-card pending">
              <div className="stat-icon pending">
                <i className="fas fa-clock"></i>
              </div>
              <div className="stat-info">
                <div className="stat-number">{stats.pendingOrders || 0}</div>
                <div className="stat-label">Pending Orders</div>
                <div className="stat-trend trend-down">
                  <i className="fas fa-exclamation-circle"></i>
                  <span>Need attention</span>
                </div>
              </div>
            </div>

            <div className="stat-card processing">
              <div className="stat-icon processing">
                <i className="fas fa-cog"></i>
              </div>
              <div className="stat-info">
                <div className="stat-number">{stats.processingOrders || 0}</div>
                <div className="stat-label">Processing</div>
                <div className="stat-trend trend-up">
                  <i className="fas fa-arrow-up"></i>
                  <span>In progress</span>
                </div>
              </div>
            </div>

            <div className="stat-card delivered">
              <div className="stat-icon delivered">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="stat-info">
                <div className="stat-number">{stats.deliveredOrders || 0}</div>
                <div className="stat-label">Delivered</div>
                <div className="stat-trend trend-up">
                  <i className="fas fa-arrow-up"></i>
                  <span>Completed</span>
                </div>
              </div>
            </div>
          </div>

          <div className="activity-grid">
            <div className="activity-card">
              <div className="card-header">
                <h3>Recent Orders ({recentOrders.length})</h3>
                <button 
                  className="btn-view-all"
                  onClick={() => navigateToSection('orders')}
                >
                  <i className="fas fa-external-link-alt"></i>
                  View All Orders ({allOrders.length})
                </button>
              </div>
              <div className="card-content">
                {recentOrders.length > 0 ? (
                  recentOrders.map((order, index) => (
                    <div key={order.id || index} className="activity-item">
                      <div className="activity-info">
                        <strong>Order {order.orderNumber}</strong>
                        <span>{order.customer || 'Unknown Customer'}</span>
                        <small className="order-customer-email">{order.customerEmail || 'No email'}</small>
                        <small className="order-date">{formatDate(order.date)}</small>
                      </div>
                      <div className="activity-meta">
                        <span className="amount">{formatPrice(order.amount || 0)}</span>
                        <div className="order-status-group">
                          <span 
                            className="status" 
                            style={{ 
                              backgroundColor: getStatusColor(order) 
                            }}
                          >
                            {getStatusText(order)}
                          </span>
                          <span 
                            className="payment-status" 
                            style={{ 
                              backgroundColor: getPaymentStatusColor(order.paymentStatus, order.paymentMethod) 
                            }}
                          >
                            {getPaymentStatusText(order)}
                          </span>
                        </div>
                        <small className="payment-method">
                          {getPaymentMethodDisplay(order.paymentMethod)}
                        </small>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-data">
                    <i className="fas fa-shopping-bag"></i>
                    <p>No recent orders found</p>
                    <small>Orders will appear here as they come in</small>
                  </div>
                )}
              </div>
            </div>

            <div className="activity-card">
              <div className="card-header">
                <h3>Quick Actions</h3>
              </div>
              <div className="card-content">
                <div className="quick-actions-grid">
                  <button 
                    className="action-btn"
                    onClick={() => navigateToSection('orders')}
                  >
                    <i className="fas fa-shopping-bag"></i>
                    <div>
                      <div>Manage Orders</div>
                      <small>{allOrders.length} total orders</small>
                    </div>
                  </button>
                  <button 
                    className="action-btn"
                    onClick={() => navigateToSection('users')}
                  >
                    <i className="fas fa-users"></i>
                    <div>
                      <div>Manage Customers</div>
                      <small>{allUsers.length} total customers</small>
                    </div>
                  </button>
                  <button 
                    className="action-btn"
                    onClick={() => navigateToSection('products')}
                  >
                    <i className="fas fa-tshirt"></i>
                    <div>
                      <div>Manage Products</div>
                      <small>Add and edit products</small>
                    </div>
                  </button>
                  <button 
                    className="action-btn"
                    onClick={() => navigateToSection('messages')}
                  >
                    <i className="fas fa-envelope"></i>
                    <div>
                      <div>Customer Messages</div>
                      <small>{stats.unreadMessages || 0} unread</small>
                    </div>
                  </button>
                  <button 
                    className="action-btn"
                    onClick={() => navigateToSection('designs')}
                  >
                    <i className="fas fa-paint-brush"></i>
                    <div>
                      <div>Custom Designs</div>
                      <small>{stats.pendingDesigns || 0} pending</small>
                    </div>
                  </button>
                  <button 
                    className="action-btn"
                    onClick={loadDashboardData}
                  >
                    <i className="fas fa-sync"></i>
                    <div>
                      <div>Refresh Data</div>
                      <small>Update dashboard information</small>
                    </div>
                  </button>
                  <button 
                    className="action-btn"
                    onClick={() => navigate('/')}
                  >
                    <i className="fas fa-store"></i>
                    <div>
                      <div>View Storefront</div>
                      <small>Visit the main store</small>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="order-stats-grid">
            <div className="order-stat-card">
              <h4>Order Status Breakdown</h4>
              <div className="status-breakdown">
                <div className="status-item">
                  <span className="status-dot" style={{ backgroundColor: '#FF9800' }}></span>
                  <span>Pending COD: {allOrders.filter(o => o.paymentMethod === 'cod' && o.status === 'pending').length}</span>
                </div>
                <div className="status-item">
                  <span className="status-dot" style={{ backgroundColor: '#4CAF50' }}></span>
                  <span>Paid & Processing: {allOrders.filter(o => 
                    (o.paymentMethod?.toLowerCase().includes('gcash') || 
                     o.paymentMethod?.toLowerCase().includes('card') ||
                     o.paymentMethod?.toLowerCase().includes('paymaya') ||
                     o.paymentMethod?.toLowerCase().includes('paymongo')) && 
                    (o.status === 'processing' || o.status === 'pending' || o.status === 'pending_payment')
                  ).length}</span>
                </div>
                <div className="status-item">
                  <span className="status-dot" style={{ backgroundColor: '#2196F3' }}></span>
                  <span>Shipped: {allOrders.filter(o => o.status === 'shipped').length}</span>
                </div>
                <div className="status-item">
                  <span className="status-dot" style={{ backgroundColor: '#4CAF50' }}></span>
                  <span>Delivered: {stats.deliveredOrders || 0}</span>
                </div>
              </div>
            </div>
            
            <div className="order-stat-card">
              <h4>Payment Status</h4>
              <div className="payment-breakdown">
                <div className="payment-item">
                  <span className="payment-dot" style={{ backgroundColor: '#4CAF50' }}></span>
                  <span>Paid: {stats.paidOrders || 0}</span>
                </div>
                <div className="payment-item">
                  <span className="payment-dot" style={{ backgroundColor: '#FF9800' }}></span>
                  <span>Pending COD: {allOrders.filter(o => o.paymentMethod === 'cod' && o.paymentStatus === 'pending_cod').length}</span>
                </div>
                <div className="payment-item">
                  <span className="payment-dot" style={{ backgroundColor: '#F44336' }}></span>
                  <span>Cancelled: {stats.cancelledOrders || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return renderDashboard();
      case 'orders':
        return <AdminOrders allOrders={allOrders} allUsers={allUsers} />;
      case 'users':
        return <AdminUsers allUsers={allUsers} allOrders={allOrders} />;
      case 'products':
        return <AdminProducts />;
      case 'messages':
        return <AdminMessages />;
      case 'designs':
        return <AdminCustomDesigns />;
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="admin-dashboard">
      <button 
        className="mobile-menu-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        <i className={`fas ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
      </button>

      <div className={`admin-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <h2>DRIFTWEAR</h2>
          <p>Admin Panel</p>
          <div className="admin-info">
            <small>Logged in as: {adminUser?.name || 'Admin'}</small>
            <small>{adminUser?.email || 'admin@driftwear.com'}</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}
            onClick={() => navigateToSection('dashboard')}
          >
            <i className="fas fa-chart-pie"></i>
            Dashboard
          </button>
          
          <button 
            className={`nav-item ${activeSection === 'orders' ? 'active' : ''}`}
            onClick={() => navigateToSection('orders')}
          >
            <i className="fas fa-shopping-bag"></i>
            Orders
            {stats.pendingOrders > 0 && (
              <span className="nav-badge">{stats.pendingOrders}</span>
            )}
          </button>
          
          <button 
            className={`nav-item ${activeSection === 'users' ? 'active' : ''}`}
            onClick={() => navigateToSection('users')}
          >
            <i className="fas fa-users"></i>
            Customers
            <span className="nav-badge">{stats.totalCustomers || 0}</span>
          </button>

          <button 
            className={`nav-item ${activeSection === 'products' ? 'active' : ''}`}
            onClick={() => navigateToSection('products')}
          >
            <i className="fas fa-tshirt"></i>
            Products
            {stats.lowStockProducts > 0 && (
              <span className="nav-badge warning">{stats.lowStockProducts}</span>
            )}
          </button>

          <button 
            className={`nav-item ${activeSection === 'messages' ? 'active' : ''}`}
            onClick={() => navigateToSection('messages')}
          >
            <i className="fas fa-envelope"></i>
            Messages
            {stats.unreadMessages > 0 && (
              <span className="nav-badge">{stats.unreadMessages}</span>
            )}
          </button>

          <button 
            className={`nav-item ${activeSection === 'designs' ? 'active' : ''}`}
            onClick={() => navigateToSection('designs')}
          >
            <i className="fas fa-paint-brush"></i>
            Custom Designs
            {stats.pendingDesigns > 0 && (
              <span className="nav-badge">{stats.pendingDesigns}</span>
            )}
          </button>

          <button 
            className={`nav-item ${activeSection === 'analytics' ? 'active' : ''}`}
            onClick={() => navigateToSection('analytics')}
          >
            <i className="fas fa-chart-line"></i>
            Analytics
          </button>

          <button 
            className={`nav-item ${activeSection === 'settings' ? 'active' : ''}`}
            onClick={() => navigateToSection('settings')}
          >
            <i className="fas fa-cog"></i>
            Settings
          </button>
        </nav>

        <div className="sidebar-footer">
          <button 
            className="nav-item"
            onClick={() => navigate('/')}
          >
            <i className="fas fa-store"></i>
            View Store
          </button>
          <button 
            className="nav-item logout"
            onClick={handleLogout}
          >
            <i className="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>
      </div>

      <div className="admin-main">
        {renderSectionContent()}
      </div>
    </div>
  );
};

export default AdminDashboard;