import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import '../css/Confirmation.css';

const ConfirmationOrders = ({ 
  currentUser, 
  formatPrice, 
  getUserOrders, 
  verifyPayMongoPayment,
  openAuthModal 
}) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [estimatedDelivery, setEstimatedDelivery] = useState('');
  const [paymentVerifying, setPaymentVerifying] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [showPaymentError, setShowPaymentError] = useState(false);
  const [paymentErrorMessage, setPaymentErrorMessage] = useState('');
  const navigate = useNavigate();
  const { orderId } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    console.log('🔍 ConfirmationOrders mounted, checking URL parameters...');
    
    // Check for PayMongo callback in URL
    const sessionId = searchParams.get('session_id');
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const demo = searchParams.get('demo');
    
    console.log('📊 URL parameters:', { sessionId, success, canceled, demo, orderId });
    
    // Always load order data first
    loadOrderData();
    
    // ========== FIX: Handle placeholder session ID ==========
    if (sessionId && (sessionId === '{CHECKOUT_SESSION_ID}' || sessionId === '[CHECKOUT_SESSION_ID]')) {
      console.log('⚠️ Placeholder session ID detected, checking localStorage...');
      
      // Try to get real session ID from localStorage
      const storedSession = JSON.parse(localStorage.getItem('current_paymongo_session') || '{}');
      const realSessionId = storedSession.sessionId;
      
      if (realSessionId && realSessionId.startsWith('cs_')) {
        console.log('✅ Found real session ID in localStorage:', realSessionId);
        
        // Update URL with real session ID
        const newUrl = new URL(window.location);
        newUrl.searchParams.set('session_id', realSessionId);
        window.history.replaceState({}, '', newUrl);
        
        // Verify payment with real session ID
        handlePayMongoCallback(realSessionId);
        
        // Still load order data
        calculateDeliveryDate();
        return;
      }
    }
    
    // If we have a valid session ID and success, verify payment
    if (sessionId && success === 'true' && 
        sessionId !== '{CHECKOUT_SESSION_ID}' && 
        sessionId !== '[CHECKOUT_SESSION_ID]' &&
        sessionId.startsWith('cs_')) {
      console.log('✅ Found valid payment callback in URL, verifying...');
      handlePayMongoCallback(sessionId);
    } 
    // If we have success but placeholder session ID, check localStorage
    else if (success === 'true') {
      console.log('⚠️ Success URL with placeholder session ID, checking localStorage...');
      checkLocalStorageForPayment();
    }
    else if (canceled === 'true') {
      console.log('❌ Payment was cancelled');
      setPaymentErrorMessage('Payment was cancelled. Please try again.');
      setShowPaymentError(true);
      
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      
      setTimeout(() => {
        setShowPaymentError(false);
        navigate('/checkout');
      }, 3000);
    }
    
    calculateDeliveryDate();
  }, [orderId, location.search]);

  const checkLocalStorageForPayment = () => {
    try {
      console.log('🔍 Checking localStorage for payment data...');
      
      const lastOrder = JSON.parse(localStorage.getItem('lastOrder') || 'null');
      const paymongoSession = JSON.parse(localStorage.getItem('current_paymongo_session') || '{}');
      const successfulPayment = JSON.parse(localStorage.getItem('successful_payment') || '{}');
      
      console.log('📋 LocalStorage check:', {
        hasLastOrder: !!lastOrder,
        hasPaymongoSession: !!paymongoSession.sessionId,
        hasSuccessfulPayment: !!successfulPayment.orderId
      });
      
      if (lastOrder && (lastOrder.paymentStatus === 'paid' || paymongoSession.sessionId || successfulPayment.orderId)) {
        console.log('✅ Found paid order in localStorage');
        setShowPaymentSuccess(true);
        setTimeout(() => {
          setShowPaymentSuccess(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking localStorage:', error);
    }
  };

  const handlePayMongoCallback = async (sessionId) => {
    try {
      console.log('🔍 Verifying PayMongo payment for session:', sessionId);
      
      if (!sessionId) {
        console.error('❌ No session ID provided for verification');
        setPaymentErrorMessage('Missing session ID for verification');
        setShowPaymentError(true);
        setTimeout(() => setShowPaymentError(false), 5000);
        return;
      }
      
      setPaymentVerifying(true);
      
      // Store session ID for reference
      localStorage.setItem('paymongo_callback_session_id', sessionId);
      localStorage.setItem('paymongo_last_callback', new Date().toISOString());
      
      // Verify payment using the function from App.jsx
      if (!verifyPayMongoPayment) {
        console.error('❌ verifyPayMongoPayment function not provided');
        setPaymentErrorMessage('Payment verification function not available');
        setShowPaymentError(true);
        setPaymentVerifying(false);
        return;
      }
      
      const result = await verifyPayMongoPayment(sessionId);
      
      console.log('📊 Verification result:', result);
      
      if (result.success) {
        if (result.status === 'paid' || result.data?.paymentStatus === 'paid') {
          console.log('✅ Payment verified as PAID');
          setPaymentStatus('paid');
          setShowPaymentSuccess(true);
          
          // Clear stored session ID after successful verification
          localStorage.removeItem('paymongo_callback_session_id');
          localStorage.removeItem('paymongo_last_callback');
          
          // Reload order data to reflect updated status
          setTimeout(() => {
            loadOrderData();
            setShowPaymentSuccess(false);
          }, 2000);
        } else if (result.status === 'pending') {
          console.log('⏳ Payment still pending');
          setPaymentStatus('pending');
          loadOrderData();
        } else {
          console.log('⚠️ Payment verification returned unexpected status:', result.status);
          setPaymentErrorMessage(`Payment status: ${result.status}`);
          setShowPaymentError(true);
          loadOrderData();
        }
      } else {
        console.error('❌ Payment verification failed:', result.error);
        setPaymentErrorMessage(result.error || 'Payment verification failed');
        setShowPaymentError(true);
        loadOrderData();
      }
    } catch (error) {
      console.error('❌ Error verifying payment:', error);
      setPaymentErrorMessage('Failed to verify payment');
      setShowPaymentError(true);
      loadOrderData();
    } finally {
      setPaymentVerifying(false);
    }
  };

  const calculateDeliveryDate = () => {
    const now = new Date();
    const deliveryStart = new Date(now);
    deliveryStart.setDate(now.getDate() + 3);
    const deliveryEnd = new Date(now);
    deliveryEnd.setDate(now.getDate() + 5);

    setEstimatedDelivery(
      `${deliveryStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${deliveryEnd.getDate()}, ${deliveryEnd.getFullYear()}`
    );
  };

  const calculateOrderTotals = (orderData) => {
    if (!orderData.items || orderData.items.length === 0) {
      return {
        subtotal: orderData.subtotal || 0,
        shipping: orderData.shipping || 0,
        tax: orderData.tax || 0,
        discount: orderData.discount || 0,
        total: orderData.total || orderData.totalAmount || 0
      };
    }

    const subtotal = orderData.items.reduce((total, item) => {
      return total + ((item.price || 0) * (item.quantity || 1));
    }, 0);

    const shipping = orderData.shipping !== undefined ? orderData.shipping : (subtotal > 50 ? 0 : 5.99);
    const taxRate = 0.08;
    const tax = subtotal * taxRate;
    const discount = orderData.discount || 0;
    const total = subtotal + shipping + tax - discount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      shipping: Math.round(shipping * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      total: Math.round(total * 100) / 100
    };
  };

  const loadOrderData = async () => {
    try {
      let orderData = null;

      // Get URL parameters
      const urlSessionId = searchParams.get('session_id');
      const urlSuccess = searchParams.get('success');
      const urlOrderId = orderId;
      const demoMode = searchParams.get('demo');

      console.log('📦 Loading order data with parameters:', {
        urlSessionId,
        urlSuccess,
        urlOrderId,
        demoMode,
        currentUserId: currentUser?.id,
        hasGetUserOrders: !!getUserOrders
      });

      // Check localStorage first
      const lastOrder = JSON.parse(localStorage.getItem('lastOrder') || 'null');
      const paymongoSession = JSON.parse(localStorage.getItem('current_paymongo_session') || '{}');
      const successfulPayment = JSON.parse(localStorage.getItem('successful_payment') || '{}');
      const pendingOrderId = localStorage.getItem('pending_order_id');
      
      console.log('📋 LocalStorage check:', {
        hasLastOrder: !!lastOrder,
        lastOrderId: lastOrder?.id,
        hasPaymongoSession: !!paymongoSession.orderId,
        paymongoOrderId: paymongoSession.orderId,
        hasSuccessfulPayment: !!successfulPayment.orderId,
        successfulPaymentId: successfulPayment.orderId,
        pendingOrderId: pendingOrderId
      });

      // Priority 1: Last order from localStorage
      if (lastOrder) {
        console.log('📄 Found last order in localStorage:', lastOrder.id);
        orderData = lastOrder;
      }

      // Priority 2: Order from PayMongo session
      if (!orderData && paymongoSession.orderId) {
        console.log('🔍 Searching for order from PayMongo session:', paymongoSession.orderId);
        
        if (currentUser && getUserOrders) {
          const userOrders = getUserOrders();
          const foundOrder = userOrders.find(order => order.id === paymongoSession.orderId);
          if (foundOrder) {
            orderData = foundOrder;
            console.log('✅ Found order in user orders');
          }
        }
      }

      // Priority 3: Order from successful payment record
      if (!orderData && successfulPayment.orderId) {
        console.log('💰 Searching for successful payment order:', successfulPayment.orderId);
        
        if (currentUser && getUserOrders) {
          const userOrders = getUserOrders();
          const foundOrder = userOrders.find(order => order.id === successfulPayment.orderId);
          if (foundOrder) {
            orderData = foundOrder;
            console.log('✅ Found successful payment order in user orders');
          }
        }
      }

      // Priority 4: Order from URL order ID
      if (!orderData && urlOrderId) {
        console.log('🔍 Searching for order by URL order ID:', urlOrderId);
        
        if (currentUser && getUserOrders) {
          const userOrders = getUserOrders();
          const foundOrder = userOrders.find(order => 
            order.id === urlOrderId || 
            order.orderNumber === urlOrderId
          );
          if (foundOrder) {
            orderData = foundOrder;
            console.log('✅ Found order by URL ID in user orders');
          }
        }
      }

      // Priority 5: Most recent user order
      if (!orderData && currentUser && getUserOrders) {
        console.log('🔄 Getting most recent user order');
        const userOrders = getUserOrders();
        if (userOrders.length > 0) {
          orderData = userOrders.sort((a, b) => {
            const dateA = new Date(a.createdAt || a.orderDate || 0);
            const dateB = new Date(b.createdAt || b.orderDate || 0);
            return dateB - dateA;
          })[0];
          console.log('✅ Using most recent user order:', orderData?.id);
        }
      }

      // Priority 6: Generate new order
      if (!orderData) {
        console.log('🛠️ Generating new order');
        orderData = generateDemoOrder();
      }

      // If we have success URL, mark as paid
      if (orderData && urlSuccess === 'true') {
        console.log('✅ Marking order as paid due to success URL');
        orderData.paymentStatus = 'paid';
        orderData.status = 'processing';
        orderData.paymentDate = orderData.paymentDate || new Date().toISOString();
        
        // Update in localStorage if possible
        if (currentUser) {
          const orderKey = `driftwear_orders_${currentUser.id}`;
          const orders = JSON.parse(localStorage.getItem(orderKey) || '[]');
          const updatedOrders = orders.map(order => 
            order.id === orderData.id ? orderData : order
          );
          localStorage.setItem(orderKey, JSON.stringify(updatedOrders));
        }
      }

      // Calculate totals
      const calculatedTotals = calculateOrderTotals(orderData);
      
      // Merge data
      const orderWithCalculatedTotals = {
        ...orderData,
        ...calculatedTotals,
        orderNumber: orderData.orderNumber || `#${orderData.id?.slice(-8) || Date.now().toString().slice(-8)}`,
        paymentStatus: orderData.paymentStatus || 
                      (orderData.paymentMethod === 'cod' || orderData.originalPaymentMethod === 'cod' ? 'pending_cod' : 'pending'),
        status: orderData.status || 
               (orderData.paymentMethod === 'cod' || orderData.originalPaymentMethod === 'cod' ? 'processing' : 'pending_payment'),
        orderDate: orderData.orderDate || orderData.createdAt || new Date().toISOString()
      };

      console.log('✅ Final order data:', {
        id: orderWithCalculatedTotals.id,
        orderNumber: orderWithCalculatedTotals.orderNumber,
        paymentStatus: orderWithCalculatedTotals.paymentStatus,
        status: orderWithCalculatedTotals.status,
        paymentMethod: orderWithCalculatedTotals.paymentMethod,
        originalPaymentMethod: orderWithCalculatedTotals.originalPaymentMethod,
        demo: orderWithCalculatedTotals.demo || false
      });
      
      setOrder(orderWithCalculatedTotals);
      
    } catch (error) {
      console.error('❌ Error loading order data:', error);
      const demoOrder = generateDemoOrder();
      const calculatedTotals = calculateOrderTotals(demoOrder);
      setOrder({
        ...demoOrder,
        ...calculatedTotals,
        orderNumber: `#${Date.now().toString().slice(-8)}`
      });
    } finally {
      setLoading(false);
    }
  };

  const generateDemoOrder = () => {
    const orderNumber = `#${Date.now().toString().slice(-8)}`;
    
    let demoItems = [];
    
    try {
      const userData = JSON.parse(localStorage.getItem('driftwear_user') || '{}');
      const userId = userData.id || 'guest';
      
      const checkoutTempKey = `driftwear_checkout_temp_${userId}`;
      const checkoutItems = JSON.parse(localStorage.getItem(checkoutTempKey) || '[]');
      
      const cartKey = `driftwear_cart_${userId}`;
      const cartItems = JSON.parse(localStorage.getItem(cartKey) || '[]');
      
      demoItems = checkoutItems.length > 0 ? checkoutItems : cartItems;
      
      if (demoItems.length === 0) {
        demoItems = [
          {
            id: 1,
            name: 'Premium Wool Blend Sweater',
            price: 89.99,
            quantity: 1,
            image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=400&fit=crop',
            size: 'M',
            color: 'Navy Blue'
          }
        ];
      }
    } catch (error) {
      console.error('Error loading items for demo order:', error);
      demoItems = [
        {
          id: 1,
          name: 'Premium Wool Blend Sweater',
          price: 89.99,
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=400&fit=crop',
          size: 'M',
          color: 'Navy Blue'
        }
      ];
    }

    const userData = JSON.parse(localStorage.getItem('driftwear_user') || '{}');
    const paymentMethod = localStorage.getItem('last_payment_method') || 'cod';
    const paymentSession = JSON.parse(localStorage.getItem('current_paymongo_session') || '{}');
    
    return {
      id: orderId || `ORD${Date.now()}`,
      orderNumber: orderNumber,
      shippingAddress: {
        firstName: userData.name ? userData.name.split(' ')[0] : 'John',
        lastName: userData.name ? userData.name.split(' ').slice(1).join(' ') : 'Doe',
        email: userData.email || 'customer@example.com',
        address: '1234 Fashion Street',
        city: 'Manila',
        province: 'Metro Manila',
        postalCode: '1000',
        country: 'Philippines',
        phone: '+63 912 345 6789'
      },
      paymentMethod: paymentSession.paymentMethod || paymentMethod,
      originalPaymentMethod: paymentMethod,
      paymentStatus: paymentSession.paymentMethod ? 'pending' : (paymentMethod === 'cod' ? 'pending_cod' : 'pending'),
      status: paymentSession.paymentMethod ? 'pending_payment' : (paymentMethod === 'cod' ? 'processing' : 'pending_payment'),
      orderDate: new Date().toISOString(),
      items: demoItems,
      discount: 0,
      shipping: 5.99,
      ...(paymentSession.checkoutUrl && { checkoutUrl: paymentSession.checkoutUrl })
    };
  };

  const handlePrint = () => {
    const printContent = document.querySelector('.confirmation-container');
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not available';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date Error';
    }
  };

  const getPaymentMethodDisplay = (method) => {
    const methods = {
      'cod': 'Cash on Delivery',
      'gcash': 'GCash',
      'paymaya': 'PayMaya',
      'card': 'Credit/Debit Card',
      'paymongo_online': 'Online Payment',
      'paymongo_gcash': 'GCash (Online)',
      'paymongo_paymaya': 'PayMaya (Online)',
      'paymongo_card': 'Card (Online)'
    };
    return methods[method] || method?.charAt(0).toUpperCase() + method?.slice(1) || 'Unknown';
  };

  const getStatusColor = (status) => {
    const colors = {
      'confirmed': '#10b981',
      'processing': '#f59e0b',
      'shipped': '#3b82f6',
      'delivered': '#10b981',
      'cancelled': '#ef4444',
      'pending': '#6b7280',
      'pending_payment': '#f59e0b',
      'payment_failed': '#ef4444',
      'paid': '#10b981'
    };
    return colors[status] || '#6b7280';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      'paid': '#10b981',
      'pending': '#f59e0b',
      'pending_cod': '#f59e0b',
      'failed': '#ef4444',
      'cancelled': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const handleCompletePayment = () => {
    if (order && order.checkoutUrl) {
      window.open(order.checkoutUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert('Payment link not available. Please contact support.');
    }
  };

  const needsPaymentAction = () => {
    return order && 
           order.paymentMethod !== 'cod' && 
           order.originalPaymentMethod !== 'cod' &&
           order.paymentStatus === 'pending' && 
           order.checkoutUrl;
  };

  const handleManualVerify = async () => {
    const sessionId = localStorage.getItem('paymongo_callback_session_id') || 
                     prompt('Enter PayMongo session ID:');
    
    if (sessionId) {
      setPaymentVerifying(true);
      try {
        if (!verifyPayMongoPayment) {
          setPaymentErrorMessage('Payment verification function not available');
          setShowPaymentError(true);
          setPaymentVerifying(false);
          return;
        }
        
        const result = await verifyPayMongoPayment(sessionId);
        if (result.success) {
          setShowPaymentSuccess(true);
          setTimeout(() => setShowPaymentSuccess(false), 3000);
          loadOrderData();
        } else {
          setPaymentErrorMessage(result.error);
          setShowPaymentError(true);
          setTimeout(() => setShowPaymentError(false), 5000);
        }
      } catch (error) {
        setPaymentErrorMessage('Verification failed');
        setShowPaymentError(true);
        setTimeout(() => setShowPaymentError(false), 5000);
      } finally {
        setPaymentVerifying(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="confirmation-loading">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <p>Loading your order details...</p>
          <p className="loading-subtitle">Please wait while we fetch your order information</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="confirmation-error">
        <div className="error-content">
          <i className="fas fa-exclamation-circle"></i>
          <h2>Order Not Found</h2>
          <p>We couldn't find the order details. Please check your order history or contact support.</p>
          <button 
            className="btn-primary"
            onClick={() => navigate('/products')}
          >
            <i className="fas fa-shopping-bag"></i>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-container">
      {paymentVerifying && (
        <div className="payment-verification-overlay">
          <div className="payment-verification-content">
            <div className="loading-spinner"></div>
            <p>Verifying your payment...</p>
            <p className="small">Please wait while we confirm your payment</p>
          </div>
        </div>
      )}

      {showPaymentSuccess && (
        <div className="payment-success-notification">
          <div className="notification-content">
            <i className="fas fa-check-circle"></i>
            <div>
              <h4>Payment Verified!</h4>
              <p>Your payment has been confirmed successfully.</p>
            </div>
            <button 
              className="notification-close"
              onClick={() => setShowPaymentSuccess(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      {showPaymentError && (
        <div className="payment-error-notification">
          <div className="notification-content">
            <i className="fas fa-exclamation-circle"></i>
            <div>
              <h4>Payment Issue</h4>
              <p>{paymentErrorMessage}</p>
            </div>
            <button 
              className="notification-close"
              onClick={() => setShowPaymentError(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      <div className="confirmation-hero">
        <div className="confirmation-hero-content">
          <div className="success-animation">
            <div className="success-icon">
              <i className="fas fa-check"></i>
            </div>
            <div className="success-ripple"></div>
          </div>
          <h1>
            {order.paymentStatus === 'paid' || order.paymentStatus === 'pending_cod' 
              ? 'Order Confirmed!' 
              : 'Order Received!'}
          </h1>
          <p className="hero-subtitle">
            {order.paymentStatus === 'paid' 
              ? `Thank you for your purchase. Your order ${order.orderNumber} has been confirmed and payment received.`
              : order.paymentStatus === 'pending_cod'
              ? `Thank you for your order ${order.orderNumber}. Please prepare cash for delivery.`
              : `Thank you for your order ${order.orderNumber}. Please complete your payment to confirm.`}
          </p>
          <div className="confirmation-badges">
            <div className="badge" style={{ backgroundColor: getStatusColor(order.status) }}>
              {order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}
            </div>
            <div className="badge">
              {getPaymentMethodDisplay(order.originalPaymentMethod || order.paymentMethod)}
            </div>
            <div className="badge" style={{ backgroundColor: getPaymentStatusColor(order.paymentStatus) }}>
              Payment: {order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1) || 'Pending'}
            </div>
            {estimatedDelivery && (
              <div className="badge">
                Estimated: {estimatedDelivery}
              </div>
            )}
          </div>
          
          {/* Debug button - only show in development */}
          {process.env.NODE_ENV === 'development' && (
            <button 
              className="btn-outline small"
              onClick={handleManualVerify}
              style={{ marginTop: '10px', fontSize: '12px' }}
            >
              <i className="fas fa-bug"></i> Debug: Verify Payment
            </button>
          )}
        </div>
      </div>

      <div className="confirmation-content">
        <div className="confirmation-grid">
          <div className="order-details-section">
            <div className="order-summary-card">
              <div className="card-header">
                <i className="fas fa-receipt"></i>
                <h2>Order Summary</h2>
                <span className="order-number">{order.orderNumber}</span>
              </div>
              <div className="card-body">
                <div className="order-items-list">
                  {order.items && order.items.map((item, index) => (
                    <div key={index} className="order-item">
                      <div className="order-item-image">
                        <img 
                          src={item.image || 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=400&fit=crop'} 
                          alt={item.name}
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=400&fit=crop';
                          }}
                        />
                      </div>
                      <div className="order-item-details">
                        <div className="order-item-name">{item.name || `Product ${index + 1}`}</div>
                        {(item.size || item.color) && (
                          <div className="order-item-variants">
                            {item.size && <span>Size: {item.size}</span>}
                            {item.color && <span>Color: {item.color}</span>}
                          </div>
                        )}
                        <div className="order-item-price">
                          {formatPrice ? formatPrice(item.price || 0) : `₱${(item.price || 0).toFixed(2)}`} × {item.quantity || 1}
                        </div>
                      </div>
                      <div className="order-item-total">
                        {formatPrice ? formatPrice((item.price || 0) * (item.quantity || 1)) : `₱${((item.price || 0) * (item.quantity || 1)).toFixed(2)}`}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="order-summary-totals">
                  <div className="summary-row">
                    <span>Subtotal ({order.items?.reduce((total, item) => total + (item.quantity || 1), 0) || 0} items)</span>
                    <span>{formatPrice ? formatPrice(order.subtotal || 0) : `₱${(order.subtotal || 0).toFixed(2)}`}</span>
                  </div>
                 
                  <div className="summary-row">
                    <span>Shipping</span>
                    <span>{order.shipping === 0 ? 'FREE' : (formatPrice ? formatPrice(order.shipping || 0) : `₱${(order.shipping || 0).toFixed(2)}`)}</span>
                  </div>
                 
                  <div className="summary-row">
                    <span>Tax</span>
                    <span>{formatPrice ? formatPrice(order.tax || 0) : `₱${(order.tax || 0).toFixed(2)}`}</span>
                  </div>
                 
                  {order.discount > 0 && (
                    <div className="summary-row discount">
                      <span>Discount</span>
                      <span>-{formatPrice ? formatPrice(order.discount || 0) : `₱${(order.discount || 0).toFixed(2)}`}</span>
                    </div>
                  )}
                 
                  <div className="summary-total">
                    <span>Total Amount</span>
                    <span>{formatPrice ? formatPrice(order.total || order.totalAmount || 0) : `₱${(order.total || order.totalAmount || 0).toFixed(2)}`}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="shipping-info-card">
              <div className="card-header">
                <i className="fas fa-truck"></i>
                <h2>Shipping Information</h2>
              </div>
              <div className="card-body">
                <div className="shipping-details">
                  <div className="shipping-address">
                    <h4>Delivery Address</h4>
                    <p>
                      {order.shippingAddress?.firstName || 'John'} {order.shippingAddress?.lastName || 'Doe'}<br />
                      {order.shippingAddress?.address || '1234 Fashion Street'}<br />
                      {order.shippingAddress?.city || 'Manila'}, {order.shippingAddress?.province || 'Metro Manila'}<br />
                      {order.shippingAddress?.postalCode || '1000'}<br />
                      {order.shippingAddress?.country || 'Philippines'}
                    </p>
                    <div className="contact-info">
                      <p><i className="fas fa-phone"></i> {order.shippingAddress?.phone || '+63 912 345 6789'}</p>
                      <p><i className="fas fa-envelope"></i> {order.shippingAddress?.email || 'customer@example.com'}</p>
                    </div>
                  </div>
                  <div className="delivery-estimate">
                    <h4>Delivery Estimate</h4>
                    <div className="delivery-date">
                      <i className="fas fa-calendar-check"></i>
                      <div>
                        <strong>{estimatedDelivery}</strong>
                        <p>3-5 business days</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="order-status-section">
            <div className="payment-info-card">
              <div className="card-header">
                <i className="fas fa-credit-card"></i>
                <h2>Payment Information</h2>
              </div>
              <div className="card-body">
                <div className="payment-details">
                  <div className="payment-method">
                    <h4>Payment Method</h4>
                    <div className="method-details">
                      <i className={order.originalPaymentMethod?.includes('gcash') || order.paymentMethod?.includes('gcash') ? 'fas fa-mobile-alt' : 
                                   order.originalPaymentMethod?.includes('paymaya') || order.paymentMethod?.includes('paymaya') ? 'fas fa-credit-card' : 
                                   order.originalPaymentMethod?.includes('card') || order.paymentMethod?.includes('card') ? 'fas fa-credit-card' : 
                                   'fas fa-money-bill-wave'}></i>
                      <div>
                        <strong>{getPaymentMethodDisplay(order.originalPaymentMethod || order.paymentMethod)}</strong>
                        <p>
                          {(order.originalPaymentMethod === 'cod' || order.paymentMethod === 'cod') && 'Pay when you receive your order'}
                          {(order.originalPaymentMethod === 'gcash' || order.paymentMethod?.includes('gcash')) && 'Pay via GCash mobile app'}
                          {(order.originalPaymentMethod === 'paymaya' || order.paymentMethod?.includes('paymaya')) && 'Pay via PayMaya'}
                          {(order.originalPaymentMethod === 'card' || order.paymentMethod?.includes('card')) && 'Pay with credit/debit card'}
                          {order.originalPaymentMethod === 'paymongo_online' && 'Online payment via PayMongo'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="payment-status">
                    <h4>Payment Status</h4>
                    <div className={`status-badge ${order.paymentStatus}`} style={{ backgroundColor: getPaymentStatusColor(order.paymentStatus) }}>
                      {order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1) || 'Pending'}
                    </div>
                    
                    {needsPaymentAction() && (
                      <div className="payment-instruction">
                        <p><i className="fas fa-info-circle"></i> Please complete your payment to confirm your order.</p>
                        <button 
                          className="btn-primary"
                          onClick={handleCompletePayment}
                          style={{ marginTop: '10px' }}
                        >
                          <i className="fas fa-external-link-alt"></i>
                          Complete Payment
                        </button>
                      </div>
                    )}
                    
                    {order.originalPaymentMethod === 'cod' && (
                      <div className="payment-instruction">
                        <p><i className="fas fa-info-circle"></i> Please prepare cash for when your order arrives.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="status-timeline-card">
              <div className="card-header">
                <i className="fas fa-history"></i>
                <h2>Order Status</h2>
              </div>
              <div className="card-body">
                <div className="timeline">
                  <div className={`timeline-step ${order.status !== 'cancelled' ? 'active' : ''}`}>
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <h4>Order {order.paymentStatus === 'paid' || order.paymentStatus === 'pending_cod' ? 'Confirmed' : 'Received'}</h4>
                      <p>{formatDate(order.orderDate)}</p>
                    </div>
                  </div>
                  <div className={`timeline-step ${(order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered') ? 'active' : ''}`}>
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <h4>Processing</h4>
                      <p>{order.paymentStatus === 'paid' || order.paymentStatus === 'pending_cod' ? 'Preparing your order' : 'Awaiting payment'}</p>
                    </div>
                  </div>
                  <div className={`timeline-step ${(order.status === 'shipped' || order.status === 'delivered') ? 'active' : ''}`}>
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <h4>Shipped</h4>
                      <p>On its way to you</p>
                    </div>
                  </div>
                  <div className={`timeline-step ${order.status === 'delivered' ? 'active' : ''}`}>
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <h4>Delivered</h4>
                      <p>Expected by {estimatedDelivery.split('-')[1] || estimatedDelivery}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="action-buttons-card">
              <div className="card-header">
                <i className="fas fa-cog"></i>
                <h2>Order Actions</h2>
              </div>
              <div className="card-body">
                <div className="action-buttons">
                  <button 
                    className="btn-primary"
                    onClick={() => navigate('/products')}
                  >
                    <i className="fas fa-shopping-bag"></i>
                    Continue Shopping
                  </button>
                 
                  <button 
                    className="btn-secondary"
                    onClick={() => navigate('/profile?tab=orders')}
                  >
                    <i className="fas fa-clipboard-list"></i>
                    View Order History
                  </button>
                 
                  <button 
                    className="btn-secondary"
                    onClick={handlePrint}
                  >
                    <i className="fas fa-print"></i>
                    Print Confirmation
                  </button>
                 
                  {needsPaymentAction() && (
                    <button 
                      className="btn-primary"
                      onClick={handleCompletePayment}
                    >
                      <i className="fas fa-credit-card"></i>
                      Complete Payment
                    </button>
                  )}
                 
                  <button 
                    className="btn-outline"
                    onClick={() => window.open('mailto:support@driftwear.com')}
                  >
                    <i className="fas fa-headset"></i>
                    Contact Support
                  </button>
                </div>
              </div>
            </div>

            <div className="help-card">
              <div className="card-header">
                <i className="fas fa-question-circle"></i>
                <h2>Need Help?</h2>
              </div>
              <div className="card-body">
                <div className="help-content">
                  <p>If you have any questions about your order, please contact our support team.</p>
                  <div className="contact-methods">
                    <a href="mailto:support@driftwear.com">
                      <i className="fas fa-envelope"></i>
                      support@driftwear.com
                    </a>
                    <a href="tel:+639123456789">
                      <i className="fas fa-phone"></i>
                      +63 912 345 6789
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="tracking-banner">
        <div className="container">
          <div className="tracking-content">
            <i className="fas fa-shipping-fast"></i>
            <div>
              <h3>Track Your Order</h3>
              <p>
                {order.paymentStatus === 'paid' || order.paymentStatus === 'pending_cod' 
                  ? 'You will receive tracking information via email once your order ships.'
                  : 'Complete your payment to receive tracking information.'}
              </p>
            </div>
            <button 
              className="btn-outline"
              onClick={() => window.location.href = `mailto:${order.shippingAddress?.email || 'customer@example.com'}`}
            >
              View Email
            </button>
          </div>
        </div>
      </div>

      {needsPaymentAction() && (
        <div className="payment-notice-banner">
          <div className="container">
            <div className="payment-notice-content">
              <i className="fas fa-exclamation-triangle"></i>
              <div>
                <h3>Payment Required</h3>
                <p>Your order is pending payment. Please complete the payment to confirm your order.</p>
              </div>
              <button 
                className="btn-primary"
                onClick={handleCompletePayment}
              >
                <i className="fas fa-credit-card"></i>
                Complete Payment Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfirmationOrders;