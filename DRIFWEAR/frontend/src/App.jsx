import React, { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Home from './components/Home';
import './css/AuthModal.css';

// Import formatPrice utility
import { formatPrice } from './utils/formatters';

// Import API helper
import { apiFetch } from './api';

// Lazy load components
const Products = lazy(() => import('./components/Products'));
const ProductDetail = lazy(() => import('./components/ProductDetail'));
const Wishlist = lazy(() => import('./components/Wishlist'));
const Cart = lazy(() => import('./components/Cart'));
const Checkout = lazy(() => import('./components/Checkout'));
const ConfirmationOrders = lazy(() => import('./components/ConfirmationOrders'));
const UserProfile = lazy(() => import('./components/UserProfile'));
const AdminLogin = lazy(() => import('./components/AdminLogin'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const Customization = lazy(() => import('./components/Customization'));
const ContactUs = lazy(() => import('./components/ContactUs'));

const LoadingFallback = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '50vh',
    fontSize: '18px',
    color: '#b71c1c'
  }}>
    <div className="loading-spinner" style={{
      width: '40px',
      height: '40px',
      border: '4px solid rgba(183, 28, 28, 0.3)',
      borderTop: '4px solid #b71c1c',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
  </div>
);

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '2rem', 
          textAlign: 'center',
          color: '#b71c1c'
        }}>
          <h2>Something went wrong loading the page.</h2>
          <p style={{ color: '#666', margin: '1rem 0' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button 
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            style={{
              padding: '10px 20px',
              background: '#b71c1c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '1rem'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [pendingPaymentSession, setPendingPaymentSession] = useState(null);
  
  const NavigateComponent = () => {
    const navigate = useNavigate();
    window.appNavigate = navigate;
    return null;
  };

  useEffect(() => {
    try {
      const userData = localStorage.getItem('driftwear_user');
      const adminData = localStorage.getItem('driftwear_admin');
      const pendingSession = localStorage.getItem('current_paymongo_session');
      
      if (userData) {
        setCurrentUser(JSON.parse(userData));
      }
      if (adminData) {
        setAdminUser(JSON.parse(adminData));
      }
      if (pendingSession) {
        setPendingPaymentSession(JSON.parse(pendingSession));
      }
      
      // Check for payment callback
      checkPaymentCallback();
      
      // Initialize AOS if available
      if (typeof AOS !== 'undefined') {
        AOS.init({
          duration: 800,
          once: true
        });
      }
    } catch (error) {
      console.log('No user or admin found');
    }
  }, []);

  // =============== PAYMENT CALLBACK HANDLER ===============
  const checkPaymentCallback = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    const demo = urlParams.get('demo');
    
    console.log('🔍 ===== CHECK PAYMENT CALLBACK START =====');
    console.log('   Session ID:', sessionId);
    console.log('   Success:', success);
    console.log('   Canceled:', canceled);
    console.log('   Demo:', demo);
    console.log('   Full URL:', window.location.href);
    
    // Handle placeholder session ID
    if (sessionId && (sessionId === '{CHECKOUT_SESSION_ID}' || sessionId === '[CHECKOUT_SESSION_ID]')) {
      console.log('⚠️ Placeholder session ID detected');
      const storedSession = JSON.parse(localStorage.getItem('current_paymongo_session') || '{}');
      const realSessionId = storedSession.sessionId;
      
      if (realSessionId) {
        console.log('✅ Found real session ID in localStorage:', realSessionId);
        // Update URL with real session ID
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('session_id', realSessionId);
        window.history.replaceState({}, document.title, newUrl.pathname + newUrl.search);
        
        if (success === 'true') {
          verifyPayMongoPayment(realSessionId);
        }
        return;
      }
    }
    
    if (sessionId && success === 'true' && 
        sessionId !== '{CHECKOUT_SESSION_ID}' && 
        sessionId !== '[CHECKOUT_SESSION_ID]') {
      console.log('✅ Found successful payment callback with session:', sessionId);
      
      // Store the session ID for verification
      localStorage.setItem('paymongo_callback_session_id', sessionId);
      localStorage.setItem('paymongo_last_callback', new Date().toISOString());
      
      // Verify the payment
      verifyPayMongoPayment(sessionId);
      
      // Clear URL parameters
      const cleanPath = window.location.pathname;
      window.history.replaceState({}, document.title, cleanPath);
    }
    
    if (canceled === 'true') {
      console.log('❌ Payment was cancelled');
      setPaymentError('Payment was cancelled. Please try again.');
      
      // Clear URL parameters
      const cleanPath = window.location.pathname;
      window.history.replaceState({}, document.title, cleanPath);
      
      setTimeout(() => {
        setPaymentError('');
        // Redirect to checkout page
        if (window.location.pathname !== '/checkout' && window.appNavigate) {
          window.appNavigate('/checkout');
        }
      }, 3000);
    }
    
    console.log('===== CHECK PAYMENT CALLBACK END =====');
  };

  // =============== PAYMENT HANDLERS ===============
  
  const initiatePayMongoPayment = async (orderData) => {
    try {
      console.log(`🚀 ===== INITIATE PAYMONGO PAYMENT START =====`);
      
      // Extract payment method from orderData (FIXED: only 1 parameter)
      const paymentMethod = orderData.paymentMethod || orderData.originalPaymentMethod || 'card';
      console.log(`   Payment Method: ${paymentMethod}`);
      console.log(`   Order ID: ${orderData.id}`);
      console.log(`   Total Amount: PHP ${orderData.totalAmount || orderData.total}`);
      console.log(`   Items: ${orderData.items?.length || 0}`);
      
      setPaymentLoading(true);
      setPaymentError('');
      
      // Prepare items with descriptions
      const itemsWithDescriptions = orderData.items.map(item => ({
        ...item,
        description: item.description || item.name || 'Product item'
      }));
      
      // Prepare customer info
      const customerName = `${orderData.shippingAddress?.firstName || ''} ${orderData.shippingAddress?.lastName || ''}`.trim() || 'Customer';
      const customerEmail = orderData.shippingAddress?.email || orderData.customerEmail || currentUser?.email || '';
      const customerPhone = orderData.shippingAddress?.phone || '';
      
      const requestBody = {
        items: itemsWithDescriptions,
        totalAmount: orderData.totalAmount || orderData.total,
        orderId: orderData.id,
        customerInfo: {
          name: customerName,
          email: customerEmail,
          phone: customerPhone
        },
        paymentMethod: paymentMethod
      };
      
      console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));
      
      // Use apiFetch instead of direct fetch
      const result = await apiFetch('/payment/create-checkout-session', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });
      
      console.log('📊 Server response:', result);
      
      if (result.success && result.checkoutUrl) {
        console.log('✅ PayMongo session created successfully');
        console.log('   Checkout URL:', result.checkoutUrl);
        console.log('   Session ID:', result.sessionId);
        console.log('   Success URL:', result.successUrl);
        console.log('   Demo mode:', result.demo || false);
        
        // Store payment session data
        const paymentSession = {
          sessionId: result.sessionId,
          checkoutUrl: result.checkoutUrl,
          successUrl: result.successUrl,
          orderId: orderData.id,
          paymentMethod: paymentMethod,
          timestamp: new Date().toISOString(),
          demo: result.demo || false
        };
        
        localStorage.setItem('current_paymongo_session', JSON.stringify(paymentSession));
        setPendingPaymentSession(paymentSession);
        
        // Also store in another key for easier retrieval
        localStorage.setItem('paymongo_last_session', JSON.stringify(paymentSession));
        
        console.log('✅ Payment session stored');
        console.log('===== INITIATE PAYMONGO PAYMENT END =====');
        
        // Return payment data object that Checkout.jsx expects
        return {
          url: result.checkoutUrl, // Checkout.jsx expects 'url' property
          checkoutUrl: result.checkoutUrl,
          successUrl: result.successUrl,
          sessionId: result.sessionId,
          demo: result.demo || false
        };
      } else {
        throw new Error(result.error || 'Payment initialization failed');
      }
    } catch (error) {
      console.error('❌ ===== PAYMONGO PAYMENT ERROR =====');
      console.error('   Error:', error.message);
      console.error('===== PAYMONGO PAYMENT ERROR END =====');
      
      setPaymentError(error.message || 'Failed to initialize payment');
      setTimeout(() => setPaymentError(''), 5000);
      throw error;
    } finally {
      setPaymentLoading(false);
    }
  };

  const verifyPayMongoPayment = async (sessionId) => {
    try {
      console.log('🔍 ===== VERIFY PAYMONGO PAYMENT START =====');
      console.log('   Session ID:', sessionId);
      console.log('   Time:', new Date().toISOString());
      
      // Validate session ID
      if (!sessionId) {
        console.error('❌ No session ID provided');
        return { 
          success: false, 
          error: 'Session ID is required' 
        };
      }
      
      setPaymentLoading(true);
      
      // Use apiFetch instead of direct fetch
      const result = await apiFetch('/payment/verify-payment', {
        method: 'POST',
        body: JSON.stringify({ sessionId: sessionId })
      });

      console.log('📊 Verification response:', result);
      
      if (result.success) {
        console.log('✅ Verification successful');
        console.log('   Status:', result.status);
        console.log('   Payment Status:', result.paymentStatus);
        
        if (result.status === 'paid' || result.paymentStatus === 'paid') {
          handlePaymentSuccess(result.data, sessionId);
          return { 
            success: true, 
            message: 'Payment successful',
            data: result.data,
            status: 'paid'
          };
        } else if (result.status === 'unpaid' || result.paymentStatus === 'pending') {
          console.log('⏳ Payment still pending');
          return { 
            success: true, 
            message: 'Payment pending',
            status: 'pending'
          };
        } else {
          setPaymentError(`Payment status: ${result.status}`);
          setTimeout(() => setPaymentError(''), 5000);
          return { 
            success: false, 
            error: `Payment status: ${result.status}`,
            status: result.status
          };
        }
      } else {
        console.error('❌ Verification failed:', result.error);
        setPaymentError(result.error || 'Payment verification failed');
        setTimeout(() => setPaymentError(''), 5000);
        return { 
          success: false, 
          error: result.error || 'Payment verification failed' 
        };
      }
    } catch (error) {
      console.error('❌ Payment verification error:', error);
      setPaymentError('Failed to verify payment');
      setTimeout(() => setPaymentError(''), 5000);
      return { 
        success: false, 
        error: 'Failed to verify payment' 
      };
    } finally {
      setPaymentLoading(false);
      console.log('===== VERIFY PAYMONGO PAYMENT END =====');
    }
  };

  const handlePaymentSuccess = (paymentData, sessionId) => {
    console.log('✅ ===== PAYMENT SUCCESS HANDLER START =====');
    console.log('   Payment Data:', paymentData);
    console.log('   Session ID:', sessionId);
    
    setPaymentSuccess(true);
    
    // Get stored session data
    const sessionData = JSON.parse(localStorage.getItem('current_paymongo_session') || '{}');
    const orderId = sessionData.orderId;
    const paymentMethod = sessionData.paymentMethod || 'online';
    const isDemo = sessionData.demo || paymentData.metadata?.demo || false;
    
    console.log('📦 Updating order:', orderId);
    console.log('💳 Payment method:', paymentMethod);
    console.log('🎮 Demo mode:', isDemo);
    
    if (orderId && currentUser) {
      // Update order in localStorage
      const orderKey = `driftwear_orders_${currentUser.id}`;
      const existingOrders = JSON.parse(localStorage.getItem(orderKey) || '[]');
      
      const updatedOrders = existingOrders.map(order => {
        if (order.id === orderId) {
          const updatedOrder = {
            ...order,
            paymentStatus: 'paid',
            status: 'processing',
            paymentDate: new Date().toISOString(),
            transactionId: paymentData?.paymentIntentId || `TXN${Date.now()}`,
            paymongoData: paymentData,
            originalPaymentMethod: paymentMethod,
            paymentMethod: paymentMethod === 'gcash' ? 'paymongo_gcash' : 
                         paymentMethod === 'paymaya' ? 'paymongo_paymaya' : 
                         paymentMethod === 'card' ? 'paymongo_card' : 'paymongo_online',
            demo: isDemo
          };
          
          return updatedOrder;
        }
        return order;
      });
      
      localStorage.setItem(orderKey, JSON.stringify(updatedOrders));
      
      // Store as last order for confirmation page
      const paidOrder = updatedOrders.find(o => o.id === orderId);
      if (paidOrder) {
        localStorage.setItem('lastOrder', JSON.stringify(paidOrder));
        localStorage.setItem('successful_payment', JSON.stringify({
          orderId: paidOrder.id,
          status: 'paid',
          method: paymentMethod,
          sessionId: sessionId,
          demo: isDemo,
          timestamp: new Date().toISOString()
        }));
      }
      
      // Clear session data
      localStorage.removeItem('current_paymongo_session');
      localStorage.removeItem('paymongo_callback_session_id');
      setPendingPaymentSession(null);
      
      // Clear checkout temp data
      localStorage.removeItem(`driftwear_checkout_temp_${currentUser.id}`);
      localStorage.removeItem(`driftwear_original_cart_${currentUser.id}`);
      
      // Set flag for cart refresh
      localStorage.setItem('recent_checkout_completed', 'true');
      
      // Save to global storage
      saveOrderToGlobalStorage(paidOrder);
      
      // Show success message
      setPaymentSuccess(true);
      setTimeout(() => setPaymentSuccess(false), 5000);
      
      // Redirect to confirmation page
      setTimeout(() => {
        if (window.appNavigate) {
          window.appNavigate(`/order-confirmation/${orderId}`);
        }
      }, 1500);
    }
    
    console.log('===== PAYMENT SUCCESS HANDLER END =====');
  };

  const handleDemoPaymentSuccess = (sessionId) => {
    console.log('🎮 Handling demo payment success for session:', sessionId);
    
    const sessionData = JSON.parse(localStorage.getItem('current_paymongo_session') || '{}');
    const orderId = sessionData.orderId;
    
    if (orderId && currentUser) {
      const orderKey = `driftwear_orders_${currentUser.id}`;
      const existingOrders = JSON.parse(localStorage.getItem(orderKey) || '[]');
      
      const updatedOrders = existingOrders.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            paymentStatus: 'paid',
            status: 'processing',
            paymentDate: new Date().toISOString(),
            transactionId: `DEMO_TXN${Date.now()}`,
            demo: true,
            paymongoSessionId: sessionId
          };
        }
        return order;
      });
      
      localStorage.setItem(orderKey, JSON.stringify(updatedOrders));
      
      const paidOrder = updatedOrders.find(o => o.id === orderId);
      if (paidOrder) {
        localStorage.setItem('lastOrder', JSON.stringify(paidOrder));
        localStorage.setItem('successful_payment', JSON.stringify({
          orderId: paidOrder.id,
          status: 'paid',
          method: 'demo',
          sessionId: sessionId,
          demo: true,
          timestamp: new Date().toISOString()
        }));
      }
      
      setPaymentSuccess(true);
      setTimeout(() => setPaymentSuccess(false), 5000);
    }
  };

  const handlePaymentError = (error) => {
    console.error('❌ Payment error:', error);
    setPaymentError(error.message || 'Payment failed');
    
    // Get stored session data
    const sessionData = JSON.parse(localStorage.getItem('current_paymongo_session') || '{}');
    const orderId = sessionData.orderId;
    
    if (orderId && currentUser) {
      const orderKey = `driftwear_orders_${currentUser.id}`;
      const existingOrders = JSON.parse(localStorage.getItem(orderKey) || '[]');
      
      const updatedOrders = existingOrders.map(order => {
        if (order.id === orderId) {
          return {
            ...order,
            paymentStatus: 'failed',
            status: 'cancelled',
            failureReason: error.message || 'Payment failed'
          };
        }
        return order;
      });
      
      localStorage.setItem(orderKey, JSON.stringify(updatedOrders));
    }
    
    localStorage.removeItem('current_paymongo_session');
    setPendingPaymentSession(null);
    
    setTimeout(() => setPaymentError(''), 5000);
  };
  
  // =============== ORDER MANAGEMENT ===============
  
  const saveOrderToGlobalStorage = (order) => {
    try {
      const globalOrdersKey = 'driftwear_all_orders';
      const existingGlobalOrders = JSON.parse(localStorage.getItem(globalOrdersKey) || '[]');
      
      const orderIndex = existingGlobalOrders.findIndex(o => o.id === order.id);
      
      if (orderIndex === -1) {
        existingGlobalOrders.unshift(order);
      } else {
        existingGlobalOrders[orderIndex] = order;
      }
      
      localStorage.setItem(globalOrdersKey, JSON.stringify(existingGlobalOrders));
      console.log('✅ Order saved to global storage:', order.id);
    } catch (error) {
      console.error('Error saving order to global storage:', error);
    }
  };
  
  const updateOrderInGlobalStorage = (updatedOrder) => {
    try {
      const globalOrdersKey = 'driftwear_all_orders';
      const existingGlobalOrders = JSON.parse(localStorage.getItem(globalOrdersKey) || '[]');
      
      const orderIndex = existingGlobalOrders.findIndex(o => o.id === updatedOrder.id);
      
      if (orderIndex !== -1) {
        existingGlobalOrders[orderIndex] = updatedOrder;
        localStorage.setItem(globalOrdersKey, JSON.stringify(existingGlobalOrders));
        console.log('✅ Order updated in global storage:', updatedOrder.id);
      }
    } catch (error) {
      console.error('Error updating order in global storage:', error);
    }
  };

  const getAllOrdersForAdmin = () => {
    try {
      console.log('📊 Loading all orders for admin...');
      let allOrders = [];
      
      const globalOrdersKey = 'driftwear_all_orders';
      const globalOrders = JSON.parse(localStorage.getItem(globalOrdersKey) || '[]');
      allOrders = [...globalOrders];
      
      const users = JSON.parse(localStorage.getItem('driftwear_users') || '[]');
      
      users.forEach(user => {
        const userOrdersKey = `driftwear_orders_${user.id}`;
        const userOrders = JSON.parse(localStorage.getItem(userOrdersKey) || '[]');
        
        userOrders.forEach(order => {
          const existingIndex = allOrders.findIndex(o => o.id === order.id);
          if (existingIndex === -1) {
            const orderWithUserInfo = {
              ...order,
              customerId: user.id,
              customerName: user.name || 'Customer',
              customerEmail: user.email || 'customer@example.com',
              userId: user.id
            };
            allOrders.push(orderWithUserInfo);
          }
        });
      });
      
      const lastOrder = JSON.parse(localStorage.getItem('lastOrder') || 'null');
      if (lastOrder && !allOrders.some(o => o.id === lastOrder.id)) {
        allOrders.push({
          ...lastOrder,
          customerId: lastOrder.customerId || currentUser?.id || 'guest',
          customerName: lastOrder.customerName || 'Guest Customer',
          customerEmail: lastOrder.customerEmail || 'guest@example.com'
        });
      }
      
      const successfulPayment = JSON.parse(localStorage.getItem('successful_payment') || 'null');
      if (successfulPayment?.orderId && !allOrders.some(o => o.id === successfulPayment.orderId)) {
        allOrders.push({
          id: successfulPayment.orderId,
          status: 'processing',
          paymentStatus: 'paid',
          orderDate: new Date(successfulPayment.timestamp).toISOString(),
          totalAmount: 0,
          paymentMethod: successfulPayment.method,
          demo: successfulPayment.demo || false,
          customerId: currentUser?.id || 'guest',
          customerName: 'Payment Customer',
          customerEmail: 'payment@example.com'
        });
      }
      
      const uniqueOrders = Array.from(new Map(allOrders.map(order => [order.id, order])).values());
      
      const sortedOrders = uniqueOrders.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.orderDate || 0);
        const dateB = new Date(b.createdAt || b.orderDate || 0);
        return dateB - dateA;
      });
      
      console.log(`✅ Loaded ${sortedOrders.length} unique orders`);
      return sortedOrders;
    } catch (error) {
      console.error('Error getting all orders:', error);
      return [];
    }
  };

  const getUserOrdersForProfile = (userId) => {
    try {
      if (!userId) return [];
      
      const allOrders = getAllOrdersForAdmin();
      const userOrders = allOrders.filter(order => 
        order.customerId === userId || order.userId === userId
      );
      
      console.log(`✅ Found ${userOrders.length} orders for user ${userId}`);
      return userOrders;
    } catch (error) {
      console.error('Error getting user orders:', error);
      return [];
    }
  };

  // =============== FIXED ORDER CREATION ===============
  const handleCreateOrder = async (orderData) => {
    try {
      console.log('🛒 ===== CREATE ORDER START =====');
      console.log('   Order data:', orderData);
      console.log('   Payment method:', orderData.paymentMethod);

      if (!currentUser) {
        console.error('❌ No user logged in');
        openAuthModal('login');
        return null;
      }

      const orderKey = `driftwear_orders_${currentUser.id}`;
      const existingOrders = JSON.parse(localStorage.getItem(orderKey) || '[]');
      
      // Generate order ID and number FIRST
      const orderId = `ORD${Date.now()}`;
      const orderNumber = `#${Date.now().toString().slice(-8)}`;

      // Calculate totals
      const calculatedSubtotal = orderData.items.reduce((total, item) => {
        const itemPrice = parseFloat(item.price) || 0;
        const itemQuantity = parseInt(item.quantity) || 1;
        return total + (itemPrice * itemQuantity);
      }, 0);
      
      const calculatedShipping = calculatedSubtotal > 50 ? 0 : 5.99;
      const calculatedTax = calculatedSubtotal * 0.08;
      const calculatedDiscount = orderData.discount || 0;
      const calculatedTotal = calculatedSubtotal + calculatedShipping + calculatedTax - calculatedDiscount;

      // Create order object
      const newOrder = {
        id: orderId,
        orderNumber: orderNumber,
        items: orderData.items || [],
        totalAmount: calculatedTotal,
        total: calculatedTotal,
        shippingAddress: orderData.shippingAddress || {},
        paymentMethod: orderData.paymentMethod,
        originalPaymentMethod: orderData.paymentMethod,
        subtotal: calculatedSubtotal,
        shipping: calculatedShipping,
        tax: calculatedTax,
        discount: calculatedDiscount,
        status: 'pending_payment',
        paymentStatus: 'pending',
        createdAt: new Date().toISOString(),
        orderDate: new Date().toISOString(),
        customerId: currentUser.id,
        customerName: currentUser.name,
        customerEmail: currentUser.email,
        customerPhone: orderData.shippingAddress?.phone || currentUser.phone || '',
        itemsRemoved: false,
        paymentDetails: orderData.paymentDetails || {}
      };
      
      console.log('✅ New order created:', newOrder);
      console.log('💳 Payment status:', newOrder.paymentStatus);
      console.log('📝 Order ID for confirmation:', orderId);

      // ========== CRITICAL: Save order BEFORE payment redirect ==========
      const updatedOrders = [newOrder, ...existingOrders];
      localStorage.setItem(orderKey, JSON.stringify(updatedOrders));
      
      saveOrderToGlobalStorage(newOrder);
      
      localStorage.setItem('lastOrder', JSON.stringify(newOrder));
      
      localStorage.setItem('pending_order_id', orderId);
      localStorage.setItem('pending_order_number', orderNumber);
      localStorage.setItem('last_payment_method', orderData.paymentMethod);
      
      localStorage.setItem('driftwear_checkout_temp', JSON.stringify(orderData.items));
      localStorage.setItem(`driftwear_checkout_temp_${currentUser.id}`, JSON.stringify(orderData.items));
      
      const cartKey = `driftwear_cart_${currentUser.id}`;
      const originalCart = JSON.parse(localStorage.getItem(cartKey) || '[]');
      localStorage.setItem(`driftwear_original_cart_${currentUser.id}`, JSON.stringify(originalCart));

      // ========== HANDLE DIFFERENT PAYMENT METHODS ==========
      
      if (orderData.paymentMethod === 'cod') {
        console.log('💰 Processing COD order');
        
        const finalOrder = {
          ...newOrder,
          status: 'processing',
          paymentStatus: 'pending_cod',
          itemsRemoved: true
        };
        
        const finalUpdatedOrders = existingOrders.map(order => 
          order.id === newOrder.id ? finalOrder : order
        );
        localStorage.setItem(orderKey, JSON.stringify(finalUpdatedOrders));
        
        updateOrderInGlobalStorage(finalOrder);
        
        localStorage.setItem('lastOrder', JSON.stringify(finalOrder));
        
        localStorage.removeItem(`driftwear_checkout_temp_${currentUser.id}`);
        localStorage.removeItem(`driftwear_original_cart_${currentUser.id}`);
        
        removeItemsFromCartAfterPurchase(orderData.items);
        
        console.log('✅ COD order created successfully');
        console.log('===== CREATE ORDER END =====');
        
        if (window.appNavigate) {
          window.appNavigate(`/order-confirmation/${orderId}`);
        }
        
        return finalOrder;
      }
      
      if (['gcash', 'paymaya', 'card'].includes(orderData.paymentMethod)) {
        console.log('💳 Processing online payment via PayMongo...');
        
        try {
          // FIXED: Pass only newOrder (1 parameter instead of 2)
          const paymentResult = await initiatePayMongoPayment(newOrder);
          
          if (paymentResult && paymentResult.checkoutUrl) {
            const paymentSession = {
              sessionId: paymentResult.sessionId,
              checkoutUrl: paymentResult.checkoutUrl,
              successUrl: paymentResult.successUrl,
              orderId: newOrder.id,
              paymentMethod: orderData.paymentMethod,
              timestamp: new Date().toISOString(),
              demo: paymentResult.demo || false
            };
            
            localStorage.setItem('current_paymongo_session', JSON.stringify(paymentSession));
            setPendingPaymentSession(paymentSession);
            
            const orderWithPayment = {
              ...newOrder,
              checkoutUrl: paymentResult.checkoutUrl,
              successUrl: paymentResult.successUrl,
              paymongoSessionId: paymentResult.sessionId,
              demo: paymentResult.demo || false
            };
            
            const ordersWithPayment = existingOrders.map(order => 
              order.id === newOrder.id ? orderWithPayment : order
            );
            localStorage.setItem(orderKey, JSON.stringify(ordersWithPayment));
            
            updateOrderInGlobalStorage(orderWithPayment);
            
            localStorage.setItem('lastOrder', JSON.stringify(orderWithPayment));
            
            console.log('✅ Online payment initialized');
            console.log('🔗 Redirecting to PayMongo...');
            console.log('===== CREATE ORDER END =====');
            
            // Redirect to PayMongo - CRITICAL FIX
            setTimeout(() => {
              window.location.href = paymentResult.checkoutUrl;
            }, 100);
            
            return orderWithPayment;
          } else {
            throw new Error('No checkout URL received from PayMongo');
          }
          
        } catch (paymentError) {
          console.error('❌ Payment initialization failed:', paymentError);
          
          const failedOrder = {
            ...newOrder,
            status: 'payment_failed',
            paymentStatus: 'failed',
            failureReason: paymentError.message
          };
          
          const failedOrders = existingOrders.map(order => 
            order.id === newOrder.id ? failedOrder : order
          );
          localStorage.setItem(orderKey, JSON.stringify(failedOrders));
          
          updateOrderInGlobalStorage(failedOrder);
          
          localStorage.setItem('lastOrder', JSON.stringify(failedOrder));
          
          setPaymentError(`Payment failed: ${paymentError.message}`);
          setTimeout(() => setPaymentError(''), 5000);
          
          console.log('❌ Order marked as payment failed');
          console.log('===== CREATE ORDER END =====');
          
          return failedOrder;
        }
      }
      
      console.log('✅ Order created successfully (other method)');
      console.log('===== CREATE ORDER END =====');
      
      return newOrder;
      
    } catch (error) {
      console.error('❌ Error creating order:', error);
      setPaymentError(`Order creation failed: ${error.message}`);
      setTimeout(() => setPaymentError(''), 5000);
      return null;
    }
  };

  const removeItemsFromCartAfterPurchase = (purchasedItems) => {
    try {
      if (!currentUser || !purchasedItems || purchasedItems.length === 0) {
        return;
      }

      const cartKey = `driftwear_cart_${currentUser.id}`;
      let cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
      
      if (cart.length === 0) return;
      
      console.log('🛒 Removing purchased items from cart...');
      
      const purchasedItemsMap = new Map();
      purchasedItems.forEach(item => {
        const key = getItemKey(item);
        const quantity = item.quantity || 1;
        purchasedItemsMap.set(key, quantity);
      });
      
      const updatedCart = [];
      cart.forEach(cartItem => {
        const cartItemKey = getItemKey(cartItem);
        const purchasedQuantity = purchasedItemsMap.get(cartItemKey);
        
        if (purchasedQuantity) {
          const cartQuantity = cartItem.quantity || 1;
          
          if (cartQuantity > purchasedQuantity) {
            cartItem.quantity = cartQuantity - purchasedQuantity;
            updatedCart.push(cartItem);
            console.log(`📦 Reduced quantity for ${cartItem.name}: ${cartQuantity} -> ${cartItem.quantity}`);
          }
        } else {
          updatedCart.push(cartItem);
        }
      });
      
      localStorage.setItem(cartKey, JSON.stringify(updatedCart));
      console.log('✅ Cart after removal:', updatedCart);
      
    } catch (error) {
      console.error('Error removing items from cart:', error);
    }
  };

  const getItemKey = (item) => {
    const safeSize = item.size || 'M';
    const safeColor = item.color || 'Blue';
    return `${item.id}-${safeSize}-${safeColor}`;
  };

  const getUserOrders = () => {
    try {
      if (!currentUser) return [];
      return getUserOrdersForProfile(currentUser.id);
    } catch (error) {
      console.error('Error getting user orders:', error);
      return [];
    }
  };

  const getOrderStats = () => {
    const orders = getUserOrders();
    return {
      totalOrders: orders.length,
      processingOrders: orders.filter(order => order.status === 'processing').length,
      deliveredOrders: orders.filter(order => order.status === 'delivered').length,
      pendingPaymentOrders: orders.filter(order => order.paymentStatus === 'pending').length,
      paidOrders: orders.filter(order => order.paymentStatus === 'paid').length
    };
  };

  const clearPaymentMessages = () => {
    setPaymentError('');
    setPaymentSuccess(false);
  };

  // =============== TEST PAYMONGO CONNECTION ===============
  const testPayMongoConnection = async () => {
    try {
      setPaymentLoading(true);
      
      // Use apiFetch instead of direct fetch
      const result = await apiFetch('/payment/test-connection');
      
      console.log('🔗 PayMongo connection test:', result);
      
      if (result.success) {
        setPaymentSuccess('PayMongo connection successful!');
        setTimeout(() => setPaymentSuccess(false), 5000);
      } else {
        setPaymentError(`PayMongo connection failed: ${result.error}`);
        setTimeout(() => setPaymentError(''), 5000);
      }
    } catch (error) {
      setPaymentError(`Connection test failed: ${error.message}`);
      setTimeout(() => setPaymentError(''), 5000);
    } finally {
      setPaymentLoading(false);
    }
  };

  // Authentication functions
  const handleLogin = async (email, password) => {
    try {
      setAuthLoading(true);
      setAuthError('');
      
      const users = JSON.parse(localStorage.getItem('driftwear_users') || '[]');
      const user = users.find(u => u.email === email && u.password === password);
      
      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        setCurrentUser(userWithoutPassword);
        localStorage.setItem('driftwear_user', JSON.stringify(userWithoutPassword));
        closeAuthModal();
        return { success: true };
      } else {
        setAuthError('Invalid email or password');
        return { success: false, error: 'Invalid email or password' };
      }
    } catch (error) {
      setAuthError('Login failed. Please try again.');
      return { success: false, error: error.message };
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignup = async (name, email, password) => {
    try {
      setAuthLoading(true);
      setAuthError('');
      
      const users = JSON.parse(localStorage.getItem('driftwear_users') || '[]');
      const existingUser = users.find(u => u.email === email);
      
      if (existingUser) {
        setAuthError('User with this email already exists');
        return { success: false, error: 'User already exists' };
      }
      
      const newUser = {
        id: `USR${Date.now()}`,
        name,
        email,
        password,
        createdAt: new Date().toISOString(),
        isAdmin: false
      };
      
      users.push(newUser);
      localStorage.setItem('driftwear_users', JSON.stringify(users));
      
      const { password: _, ...userWithoutPassword } = newUser;
      setCurrentUser(userWithoutPassword);
      localStorage.setItem('driftwear_user', JSON.stringify(userWithoutPassword));
      
      closeAuthModal();
      return { success: true };
    } catch (error) {
      setAuthError('Signup failed. Please try again.');
      return { success: false, error: error.message };
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('driftwear_user');
    setCurrentUser(null);
    window.location.href = '/';
  };

  const handleAdminLogin = (adminData) => {
    setAdminUser(adminData);
    localStorage.setItem('driftwear_admin', JSON.stringify(adminData));
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('driftwear_admin');
    setAdminUser(null);
    window.location.href = '/';
  };

  const handleSendMessage = (messageData) => {
    try {
      const messagesKey = 'driftwear_messages';
      const existingMessages = JSON.parse(localStorage.getItem(messagesKey) || '[]');
      
      const newMessage = {
        id: `MSG${Date.now()}`,
        userId: currentUser?.id || 'guest',
        userName: messageData.name,
        userEmail: messageData.email,
        subject: messageData.subject,
        message: messageData.message,
        timestamp: new Date().toISOString(),
        status: 'unread',
        priority: messageData.priority || 'medium',
        orderId: messageData.orderId || null,
        replies: []
      };
      
      const updatedMessages = [newMessage, ...existingMessages];
      localStorage.setItem(messagesKey, JSON.stringify(updatedMessages));
      
      console.log('✅ Message sent successfully:', newMessage);
      return newMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  };

  const openAuthModal = (mode = 'login') => {
    setAuthTab(mode);
    setAuthError('');
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    setAuthError('');
    setAuthLoading(false);
  };

  const AdminRoute = ({ children }) => {
    return adminUser ? children : <Navigate to="/admin/login" />;
  };

  const ProtectedRoute = ({ children, requireAuth = true }) => {
    const [checkingAuth, setCheckingAuth] = useState(true);
    
    useEffect(() => {
      const storedUser = localStorage.getItem('driftwear_user');
      
      if (requireAuth && !storedUser) {
        const timer = setTimeout(() => {
          window.location.href = '/';
        }, 100);
        return () => clearTimeout(timer);
      } else {
        setCheckingAuth(false);
      }
    }, [requireAuth]);
    
    if (checkingAuth) {
      return <LoadingFallback />;
    }
    
    return children;
  };

  return (
    <Router basename="/">
      <div className="App">
        <NavigateComponent />
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          .payment-notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            z-index: 9999;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            animation: slideIn 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          
          .payment-success {
            background: #10b981;
            color: white;
            border-left: 4px solid #059669;
          }
          
          .payment-error {
            background: #ef4444;
            color: white;
            border-left: 4px solid #dc2626;
          }
          
          .payment-notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1;
          }
          
          .payment-notification-close {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 0;
            margin-left: 10px;
          }
          
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          
          .payment-loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9998;
          }
          
          .payment-loading-content {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
          }
          
          .payment-loading-content .spinner {
            width: 50px;
            height: 50px;
            border: 5px solid #f3f3f3;
            borderTop: 5px solid #b71c1c;
            borderRadius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          
          .payment-loading-content p {
            font-size: 16px;
            color: '#333';
            margin: 0;
          }
          
          .payment-loading-content p.small {
            font-size: 14px;
            color: '#666';
            margin-top: 10px;
          }
        `}</style>
        
        {paymentSuccess && (
          <div className="payment-notification payment-success">
            <div className="payment-notification-content">
              <i className="fas fa-check-circle" style={{ fontSize: '20px' }}></i>
              <span>{typeof paymentSuccess === 'string' ? paymentSuccess : 'Payment Successful! Your order has been confirmed.'}</span>
            </div>
            <button 
              className="payment-notification-close"
              onClick={clearPaymentMessages}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}
        
        {paymentError && (
          <div className="payment-notification payment-error">
            <div className="payment-notification-content">
              <i className="fas fa-exclamation-circle" style={{ fontSize: '20px' }}></i>
              <span>{paymentError}</span>
            </div>
            <button 
              className="payment-notification-close"
              onClick={clearPaymentMessages}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}
        
        <main>
          <ErrorBoundary>
            <Routes>
              <Route 
                path="/" 
                element={
                  <Home 
                    openAuthModal={openAuthModal}
                    currentUser={currentUser}
                    onLogout={handleLogout}
                    onSendMessage={handleSendMessage}
                    testPayMongoConnection={testPayMongoConnection}
                  />
                } 
              />
              <Route 
                path="/products" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <Products 
                      openAuthModal={openAuthModal}
                      currentUser={currentUser}
                      formatPrice={formatPrice}
                    />
                  </Suspense>
                } 
              />
              <Route 
                path="/product/:id" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <ProductDetail 
                      openAuthModal={openAuthModal}
                      currentUser={currentUser}
                      formatPrice={formatPrice}
                    />
                  </Suspense>
                } 
              />
              <Route 
                path="/wishlist" 
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingFallback />}>
                      <Wishlist 
                        openAuthModal={openAuthModal}
                        currentUser={currentUser}
                        formatPrice={formatPrice}
                      />
                    </Suspense>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/cart" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <Cart 
                      openAuthModal={openAuthModal}
                      currentUser={currentUser}
                      formatPrice={formatPrice}
                    />
                  </Suspense>
                } 
              />
              <Route 
                path="/checkout" 
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingFallback />}>
                      <Checkout 
                        openAuthModal={openAuthModal}
                        currentUser={currentUser}
                        onCreateOrder={handleCreateOrder}
                        onInitiatePayMongoPayment={initiatePayMongoPayment}
                        paymentLoading={paymentLoading}
                        testPayMongoConnection={testPayMongoConnection}
                        formatPrice={formatPrice}
                      />
                    </Suspense>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/order-confirmation/:orderId" 
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingFallback />}>
                      <ConfirmationOrders 
                        openAuthModal={openAuthModal}
                        currentUser={currentUser}
                        getUserOrders={getUserOrders}
                        formatPrice={formatPrice}
                        verifyPayMongoPayment={verifyPayMongoPayment}
                      />
                    </Suspense>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/order-confirmation" 
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingFallback />}>
                      <ConfirmationOrders 
                        openAuthModal={openAuthModal}
                        currentUser={currentUser}
                        getUserOrders={getUserOrders}
                        formatPrice={formatPrice}
                        verifyPayMongoPayment={verifyPayMongoPayment}
                      />
                    </Suspense>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingFallback />}>
                      <UserProfile 
                        openAuthModal={openAuthModal}
                        currentUser={currentUser}
                        getUserOrders={getUserOrders}
                        getOrderStats={getOrderStats}
                        onLogout={handleLogout}
                        onSendMessage={handleSendMessage}
                        formatPrice={formatPrice}
                      />
                    </Suspense>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/customization" 
                element={
                  <ProtectedRoute>
                    <Suspense fallback={<LoadingFallback />}>
                      <Customization 
                        openAuthModal={openAuthModal}
                        currentUser={currentUser}
                      />
                    </Suspense>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/contact" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <ContactUs 
                      openAuthModal={openAuthModal}
                      currentUser={currentUser}
                      onSendMessage={handleSendMessage}
                    />
                  </Suspense>
                } 
              />
              
              <Route 
                path="/admin/login" 
                element={
                  <Suspense fallback={<LoadingFallback />}>
                    <AdminLogin 
                      onAdminLogin={handleAdminLogin}
                      currentAdmin={adminUser}
                    />
                  </Suspense>
                } 
              />
              
              <Route 
                path="/admin" 
                element={
                  <AdminRoute>
                    <Suspense fallback={<LoadingFallback />}>
                      <AdminDashboard 
                        adminUser={adminUser}
                        onAdminLogout={handleAdminLogout}
                        getAllOrdersForAdmin={getAllOrdersForAdmin}
                      />
                    </Suspense>
                  </AdminRoute>
                } 
              />
              
              <Route 
                path="/admin/*" 
                element={
                  <AdminRoute>
                    <Suspense fallback={<LoadingFallback />}>
                      <AdminDashboard 
                        adminUser={adminUser}
                        onAdminLogout={handleAdminLogout}
                        getAllOrdersForAdmin={getAllOrdersForAdmin}
                      />
                    </Suspense>
                  </AdminRoute>
                } 
              />
              
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </ErrorBoundary>
        </main>

        {/* Auth Modal */}
        {authModalOpen && (
          <div className="modal" onClick={closeAuthModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <span className="modal-close" onClick={closeAuthModal}>&times;</span>
              
              <div className="modal-tabs">
                <div 
                  className={`modal-tab ${authTab === 'login' ? 'active' : ''}`}
                  onClick={() => { setAuthTab('login'); setAuthError(''); }}
                >
                  Login
                </div>
                <div 
                  className={`modal-tab ${authTab === 'signup' ? 'active' : ''}`}
                  onClick={() => { setAuthTab('signup'); setAuthError(''); }}
                >
                  Sign Up
                </div>
              </div>
              
              {authTab === 'login' ? (
                <div className="modal-form">
                  <h3>Login to Your Account</h3>
                  {authError && <div className="error-message">{authError}</div>}
                  <div className="form-group">
                    <label>Email</label>
                    <input 
                      type="email" 
                      id="login-email"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input 
                      type="password" 
                      id="login-password"
                      placeholder="Enter your password"
                    />
                  </div>
                  <button 
                    className="modal-submit"
                    onClick={() => {
                      const email = document.getElementById('login-email').value;
                      const password = document.getElementById('login-password').value;
                      handleLogin(email, password);
                    }}
                    disabled={authLoading}
                  >
                    {authLoading ? 'Logging in...' : 'Login'}
                  </button>
                </div>
              ) : (
                <div className="modal-form">
                  <h3>Create New Account</h3>
                  {authError && <div className="error-message">{authError}</div>}
                  <div className="form-group">
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      id="signup-name"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input 
                      type="email" 
                      id="signup-email"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input 
                      type="password" 
                      id="signup-password"
                      placeholder="Create a password"
                    />
                  </div>
                  <button 
                    className="modal-submit"
                    onClick={() => {
                      const name = document.getElementById('signup-name').value;
                      const email = document.getElementById('signup-email').value;
                      const password = document.getElementById('signup-password').value;
                      handleSignup(name, email, password);
                    }}
                    disabled={authLoading}
                  >
                    {authLoading ? 'Creating Account...' : 'Sign Up'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {paymentLoading && (
          <div className="payment-loading-overlay">
            <div className="payment-loading-content">
              <div className="spinner"></div>
              <p>Initializing payment gateway...</p>
              <p className="small">Please wait while we connect to PayMongo</p>
            </div>
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;