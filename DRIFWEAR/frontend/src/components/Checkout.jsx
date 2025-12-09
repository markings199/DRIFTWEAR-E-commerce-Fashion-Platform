import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../css/Checkout.css';

function Checkout({ currentUser, onCreateOrder, paymentLoading, onInitiatePayMongoPayment, formatPrice }) {
  const [checkoutItems, setCheckoutItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'Philippines',
    paymentMethod: 'cod',
    cardNumber: '',
    cardExpiry: '',
    cardCVC: '',
    gcashNumber: '',
    paymayaNumber: '',
    notes: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [total, setTotal] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [shipping, setShipping] = useState(5.99);
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [isCheckingUser, setIsCheckingUser] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkUserAndLoad = () => {
      const storedUser = localStorage.getItem('driftwear_user');
      
      if (!currentUser && storedUser) {
        console.log('User found in localStorage during checkout page refresh');
        setTimeout(() => {
          loadCheckoutItems();
          setIsCheckingUser(false);
        }, 500);
      } else if (currentUser) {
        loadCheckoutItems();
        setIsCheckingUser(false);
      } else {
        setTimeout(() => {
          setIsCheckingUser(false);
          if (!storedUser) {
            alert('Please log in to checkout');
            navigate('/');
          }
        }, 1000);
      }
      
      if (currentUser || storedUser) {
        const user = currentUser || JSON.parse(storedUser);
        setFormData(prev => ({
          ...prev,
          email: user.email || '',
          firstName: user.name ? user.name.split(' ')[0] : '',
          lastName: user.name ? user.name.split(' ').slice(1).join(' ') : '',
          phone: user.phone || ''
        }));
      }
    };
    
    checkUserAndLoad();
  }, [currentUser, navigate]);

  useEffect(() => {
    setShowPaymentInfo(['gcash', 'paymaya', 'card'].includes(formData.paymentMethod));
  }, [formData.paymentMethod]);

  const loadCheckoutItems = () => {
    try {
      setLoading(true);
      
      const userData = JSON.parse(localStorage.getItem('driftwear_user') || '{}');
      const userId = userData.id || (currentUser?.id || 'guest');
      
      console.log('🛒 Loading checkout items for user:', userId);
      
      // Try to load items from checkout_temp first
      let items = [];
      const checkoutTempKey = `driftwear_checkout_temp_${userId}`;
      items = JSON.parse(localStorage.getItem(checkoutTempKey) || '[]');
      
      // If no items in temp, try current cart
      if (items.length === 0) {
        const cartKey = `driftwear_cart_${userId}`;
        items = JSON.parse(localStorage.getItem(cartKey) || '[]');
      }
      
      // Calculate totals regardless
      const calculatedSubtotal = items.reduce((total, item) => {
        return total + ((item.price || 0) * (item.quantity || 1));
      }, 0);
      
      const calculatedShipping = calculatedSubtotal > 50 ? 0 : 5.99;
      const calculatedTax = calculatedSubtotal * 0.08;
      const calculatedTotal = calculatedSubtotal + calculatedShipping + calculatedTax;
      
      setCheckoutItems(items);
      setSubtotal(calculatedSubtotal);
      setShipping(calculatedShipping);
      setTax(calculatedTax);
      setTotal(calculatedTotal);
      
    } catch (error) {
      console.error('❌ Error loading checkout items:', error);
      // Don't show any error, just continue
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handlePaymentMethodChange = (method) => {
    setFormData(prev => ({
      ...prev,
      paymentMethod: method
    }));
    
    localStorage.setItem('last_payment_method', method);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Email is invalid';
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.address.trim()) errors.address = 'Address is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.postalCode.trim()) errors.postalCode = 'Postal code is required';
    
    if (formData.paymentMethod === 'card') {
      if (!formData.cardNumber.trim()) errors.cardNumber = 'Card number is required';
      if (!formData.cardExpiry.trim()) errors.cardExpiry = 'Expiry date is required';
      if (!formData.cardCVC.trim()) errors.cardCVC = 'CVC is required';
    } else if (formData.paymentMethod === 'gcash') {
      if (!formData.gcashNumber.trim()) errors.gcashNumber = 'GCash number is required';
    } else if (formData.paymentMethod === 'paymaya') {
      if (!formData.paymayaNumber.trim()) errors.paymayaNumber = 'PayMaya number is required';
    }
    
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('🛒 ===== SUBMIT ORDER START =====');
      console.log('   Payment method:', formData.paymentMethod);
      
      const userData = JSON.parse(localStorage.getItem('driftwear_user') || '{}');
      const userId = userData.id || (currentUser?.id || 'guest');
      
      const orderData = {
        items: checkoutItems,
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          province: formData.province,
          postalCode: formData.postalCode,
          country: formData.country
        },
        paymentMethod: formData.paymentMethod,
        totalAmount: total,
        subtotal: subtotal,
        shipping: shipping,
        tax: tax,
        discount: discount,
        notes: formData.notes,
        paymentDetails: formData.paymentMethod === 'gcash' ? { gcashNumber: formData.gcashNumber } :
                       formData.paymentMethod === 'paymaya' ? { paymayaNumber: formData.paymayaNumber } :
                       formData.paymentMethod === 'card' ? { 
                         cardLast4: formData.cardNumber.slice(-4),
                         cardExpiry: formData.cardExpiry
                       } : {}
      };
      
      console.log('📦 Order data prepared');
      console.log('   Payment method for order:', orderData.paymentMethod);
      
      // Store payment method for reference
      localStorage.setItem('last_payment_method', formData.paymentMethod);
      
      // Create the order
      const order = await onCreateOrder(orderData);
      
      if (order) {
        console.log('✅ Order created successfully:', order.id);
        console.log('📊 Order details:', {
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod
        });
        
        // Clear checkout data
        const checkoutTempKey = `driftwear_checkout_temp_${userId}`;
        localStorage.removeItem(checkoutTempKey);
        
        const originalCartKey = `driftwear_original_cart_${userId}`;
        localStorage.removeItem(originalCartKey);
        
        // Clear cart
        const cartKey = `driftwear_cart_${userId}`;
        localStorage.setItem(cartKey, JSON.stringify([]));
        
        localStorage.setItem('lastOrder', JSON.stringify(order));
        localStorage.setItem('recent_checkout_completed', 'true');
        localStorage.setItem('driftwear_last_demo_order', JSON.stringify(order));
        
        // For COD orders, redirect to confirmation
        if (formData.paymentMethod === 'cod') {
          console.log('💰 COD order - redirecting to confirmation');
          
          setTimeout(() => {
            navigate(`/order-confirmation/${order.id}`);
          }, 500);
        } else {
          console.log('💳 Online payment - initiating payment...');
          // Initiate PayMongo payment
          const paymentSession = await onInitiatePayMongoPayment(order);
          
          if (paymentSession?.url) {
            console.log('🌐 Redirecting to payment gateway:', paymentSession.url);
            window.location.href = paymentSession.url;
          } else {
            throw new Error('Failed to initiate payment session');
          }
        }
        
        console.log('===== SUBMIT ORDER END =====');
        
      } else {
        console.error('❌ Failed to create order');
        alert('Failed to create order. Please try again.');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('❌ Order submission error:', error);
      alert('An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const formatPriceLocal = (price) => {
    if (formatPrice) {
      return formatPrice(price);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'PHP'
    }).format(price);
  };

  const goBackToCart = () => {
    navigate('/cart');
  };

  const getPaymentMethodName = (method) => {
    const methods = {
      'cod': 'Cash on Delivery',
      'gcash': 'GCash',
      'paymaya': 'PayMaya',
      'card': 'Credit/Debit Card'
    };
    return methods[method] || method;
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      'cod': 'fas fa-money-bill-wave',
      'gcash': 'fas fa-mobile-alt',
      'paymaya': 'fas fa-credit-card',
      'card': 'fas fa-credit-card'
    };
    return icons[method] || 'fas fa-credit-card';
  };

  const getPaymentInstructions = (method) => {
    switch(method) {
      case 'gcash':
      case 'paymaya':
      case 'card':
        return 'You will be redirected to PayMongo secure payment gateway to complete your payment.';
      case 'cod':
        return 'Pay when you receive your order. No online payment required.';
      default:
        return '';
    }
  };

  if (isCheckingUser) {
    return (
      <div className="checkout-loading">
        <div className="container">
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 20px' }}></div>
            <div style={{ fontSize: '48px', color: 'var(--brand)' }}>🛒</div>
            <p style={{ marginTop: '20px', fontSize: '18px', color: 'var(--text)' }}>Loading checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="checkout-loading">
        <div className="container">
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 20px' }}></div>
            <div style={{ fontSize: '48px', color: 'var(--brand)' }}>🛒</div>
            <p style={{ marginTop: '20px', fontSize: '18px', color: 'var(--text)' }}>Loading your order...</p>
          </div>
        </div>
      </div>
    );
  }

  // REMOVED EMPTY CART CHECK - Always show checkout form

  return (
    <div className="checkout-page">
      <div className="checkout-progress">
        <div className="container">
          <div className="progress-steps">
            <div className="progress-step completed">
              <div className="step-circle">1</div>
              <div className="step-label">Cart</div>
            </div>
            <div className="progress-step active">
              <div className="step-circle">2</div>
              <div className="step-label">Checkout</div>
            </div>
            <div className="progress-step">
              <div className="step-circle">3</div>
              <div className="step-label">Confirmation</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="checkout-header">
          <h1>Complete Your Purchase</h1>
          <p className="checkout-subtitle">Please review your order and fill in your details</p>
          <div className="order-summary-header-info">
            <i className="fas fa-shopping-bag"></i>
            <span>{checkoutItems.length} item(s)</span>
          </div>
        </div>

        <div className="checkout-grid">
          <div className="checkout-form-section">
            <form onSubmit={handleSubmit} className="checkout-form">
              <div className="form-card">
                <div className="form-card-header">
                  <i className="fas fa-user"></i>
                  <h2>Contact Information</h2>
                </div>
                <div className="form-card-body">
                  <div className="form-row">
                    <div className="form-group">
                      <label>First Name *</label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className={formErrors.firstName ? 'error' : ''}
                        placeholder="Enter your first name"
                        disabled={isSubmitting}
                      />
                      {formErrors.firstName && <span className="error-message"><i className="fas fa-exclamation-circle"></i> {formErrors.firstName}</span>}
                    </div>
                    <div className="form-group">
                      <label>Last Name *</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className={formErrors.lastName ? 'error' : ''}
                        placeholder="Enter your last name"
                        disabled={isSubmitting}
                      />
                      {formErrors.lastName && <span className="error-message"><i className="fas fa-exclamation-circle"></i> {formErrors.lastName}</span>}
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={formErrors.email ? 'error' : ''}
                        placeholder="your.email@example.com"
                        disabled={isSubmitting}
                      />
                      {formErrors.email && <span className="error-message"><i className="fas fa-exclamation-circle"></i> {formErrors.email}</span>}
                    </div>
                    <div className="form-group">
                      <label>Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={formErrors.phone ? 'error' : ''}
                        placeholder="+63 912 345 6789"
                        disabled={isSubmitting}
                      />
                      {formErrors.phone && <span className="error-message"><i className="fas fa-exclamation-circle"></i> {formErrors.phone}</span>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <i className="fas fa-map-marker-alt"></i>
                  <h2>Shipping Address</h2>
                </div>
                <div className="form-card-body">
                  <div className="form-group">
                    <label>Street Address *</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={formErrors.address ? 'error' : ''}
                      placeholder="Enter your street address"
                      disabled={isSubmitting}
                    />
                    {formErrors.address && <span className="error-message"><i className="fas fa-exclamation-circle"></i> {formErrors.address}</span>}
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>City *</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className={formErrors.city ? 'error' : ''}
                        placeholder="Enter your city"
                        disabled={isSubmitting}
                      />
                      {formErrors.city && <span className="error-message"><i className="fas fa-exclamation-circle"></i> {formErrors.city}</span>}
                    </div>
                    <div className="form-group">
                      <label>Province</label>
                      <input
                        type="text"
                        name="province"
                        value={formData.province}
                        onChange={handleInputChange}
                        placeholder="Enter your province"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Postal Code *</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        className={formErrors.postalCode ? 'error' : ''}
                        placeholder="Enter postal code"
                        disabled={isSubmitting}
                      />
                      {formErrors.postalCode && <span className="error-message"><i className="fas fa-exclamation-circle"></i> {formErrors.postalCode}</span>}
                    </div>
                    <div className="form-group">
                      <label>Country</label>
                      <select
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        disabled={isSubmitting}
                      >
                        <option value="Philippines">Philippines</option>
                        <option value="United States">United States</option>
                        <option value="Canada">Canada</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Australia">Australia</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <i className="fas fa-credit-card"></i>
                  <h2>Payment Method</h2>
                </div>
                <div className="form-card-body">
                  <div className="payment-instructions">
                    <p className="instruction-note">
                      <i className="fas fa-info-circle"></i>
                      {getPaymentInstructions(formData.paymentMethod)}
                    </p>
                  </div>

                  <div className="payment-methods-grid">
                    {['cod', 'gcash', 'paymaya', 'card'].map(method => (
                      <div 
                        key={method}
                        className={`payment-method-card ${formData.paymentMethod === method ? 'active' : ''} ${isSubmitting ? 'disabled' : ''}`}
                        onClick={() => !isSubmitting && handlePaymentMethodChange(method)}
                      >
                        <div className="payment-method-content">
                          <div className="payment-method-icon">
                            <i className={getPaymentMethodIcon(method)}></i>
                          </div>
                          <div className="payment-method-info">
                            <h4>{getPaymentMethodName(method)}</h4>
                            <p>
                              {method === 'cod' && 'Pay when you receive your order'}
                              {method === 'gcash' && 'Pay via GCash'}
                              {method === 'paymaya' && 'Pay via PayMaya'}
                              {method === 'card' && 'Pay with credit/debit card'}
                            </p>
                          </div>
                          <div className="payment-method-radio">
                            <div className={`radio-circle ${formData.paymentMethod === method ? 'active' : ''}`}>
                              {formData.paymentMethod === method && <div className="radio-inner"></div>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {showPaymentInfo && (
                    <div className="payment-details animated fadeIn">
                      {formData.paymentMethod === 'gcash' && (
                        <div className="payment-info-card">
                          <div className="payment-info-header">
                            <i className="fas fa-info-circle"></i>
                            <h4>GCash Payment</h4>
                          </div>
                          <div className="payment-info-body">
                            <div className="form-group">
                              <label>GCash Mobile Number *</label>
                              <input
                                type="tel"
                                name="gcashNumber"
                                value={formData.gcashNumber}
                                onChange={handleInputChange}
                                className={formErrors.gcashNumber ? 'error' : ''}
                                placeholder="09XX XXX XXXX"
                                disabled={isSubmitting}
                              />
                              {formErrors.gcashNumber && <span className="error-message"><i className="fas fa-exclamation-circle"></i> {formErrors.gcashNumber}</span>}
                            </div>
                            <div className="alert alert-info">
                              <i className="fas fa-external-link-alt"></i>
                              <div>
                                <strong>Secure Payment Gateway</strong>
                                <p>You will be redirected to PayMongo secure payment gateway to complete your GCash payment.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {formData.paymentMethod === 'paymaya' && (
                        <div className="payment-info-card">
                          <div className="payment-info-header">
                            <i className="fas fa-info-circle"></i>
                            <h4>PayMaya Payment</h4>
                          </div>
                          <div className="payment-info-body">
                            <div className="form-group">
                              <label>PayMaya Mobile Number *</label>
                              <input
                                type="tel"
                                name="paymayaNumber"
                                value={formData.paymayaNumber}
                                onChange={handleInputChange}
                                className={formErrors.paymayaNumber ? 'error' : ''}
                                placeholder="09XX XXX XXXX"
                                disabled={isSubmitting}
                              />
                              {formErrors.paymayaNumber && <span className="error-message"><i className="fas fa-exclamation-circle"></i> {formErrors.paymayaNumber}</span>}
                            </div>
                            <div className="alert alert-info">
                              <i className="fas fa-external-link-alt"></i>
                              <div>
                                <strong>Secure Payment Gateway</strong>
                                <p>You will be redirected to PayMongo secure payment gateway to complete your PayMaya payment.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {formData.paymentMethod === 'card' && (
                        <div className="payment-info-card">
                          <div className="payment-info-header">
                            <i className="fas fa-lock"></i>
                            <h4>Card Details</h4>
                          </div>
                          <div className="payment-info-body">
                            <div className="form-group">
                              <label>Card Number *</label>
                              <input
                                type="text"
                                name="cardNumber"
                                value={formData.cardNumber}
                                onChange={handleInputChange}
                                className={formErrors.cardNumber ? 'error' : ''}
                                placeholder="1234 5678 9012 3456"
                                disabled={isSubmitting}
                              />
                              {formErrors.cardNumber && <span className="error-message"><i className="fas fa-exclamation-circle"></i> {formErrors.cardNumber}</span>}
                            </div>
                            
                            <div className="form-row">
                              <div className="form-group">
                                <label>Expiry Date *</label>
                                <input
                                  type="text"
                                  name="cardExpiry"
                                  value={formData.cardExpiry}
                                  onChange={handleInputChange}
                                  className={formErrors.cardExpiry ? 'error' : ''}
                                  placeholder="MM/YY"
                                  disabled={isSubmitting}
                                />
                                {formErrors.cardExpiry && <span className="error-message"><i className="fas fa-exclamation-circle"></i> {formErrors.cardExpiry}</span>}
                              </div>
                              <div className="form-group">
                                <label>CVC *</label>
                                <input
                                  type="text"
                                  name="cardCVC"
                                  value={formData.cardCVC}
                                  onChange={handleInputChange}
                                  className={formErrors.cardCVC ? 'error' : ''}
                                  placeholder="123"
                                  disabled={isSubmitting}
                                />
                                {formErrors.cardCVC && <span className="error-message"><i className="fas fa-exclamation-circle"></i> {formErrors.cardCVC}</span>}
                              </div>
                            </div>
                            
                            <div className="secure-payment-note">
                              <i className="fas fa-shield-alt"></i>
                              <span>You will be redirected to secure payment gateway</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-card">
                <div className="form-card-header">
                  <i className="fas fa-sticky-note"></i>
                  <h2>Additional Notes (Optional)</h2>
                </div>
                <div className="form-card-body">
                  <div className="form-group">
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Special instructions for delivery, packaging preferences, or any other notes..."
                      rows="4"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-back"
                  onClick={goBackToCart}
                  disabled={isSubmitting || paymentLoading}
                >
                  <i className="fas fa-arrow-left"></i>
                  Back to Cart
                </button>
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={isSubmitting || paymentLoading}
                >
                  {isSubmitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      {formData.paymentMethod === 'cod' ? 'Placing Order...' : 'Processing Payment...'}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-lock"></i>
                      {formData.paymentMethod === 'cod' ? 'Place Order' : 'Proceed to Payment'} - {formatPriceLocal(total)}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="order-summary-section">
            <div className="order-summary-card">
              <div className="order-summary-header">
                <i className="fas fa-shopping-bag"></i>
                <h2>Order Summary</h2>
                <span className="item-count">{checkoutItems.length} item(s)</span>
              </div>
              
              <div className="order-items-list">
                {checkoutItems.map((item, index) => {
                  const safeSize = item.size || 'M';
                  const safeColor = item.color || 'Blue';
                  
                  return (
                    <div key={index} className="order-item">
                      <div className="order-item-image">
                        <img 
                          src={item.image || 'https://via.placeholder.com/100'} 
                          alt={item.name}
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/100x100/cccccc/ffffff?text=Product';
                          }}
                        />
                      </div>
                      <div className="order-item-details">
                        <div className="order-item-name">{item.name}</div>
                        <div className="order-item-variants">Size: {safeSize}, Color: {safeColor}</div>
                        <div className="order-item-price">
                          {formatPriceLocal(item.price)} × {item.quantity || 1}
                        </div>
                      </div>
                      <div className="order-item-total">
                        {formatPriceLocal(item.price * (item.quantity || 1))}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="order-summary-details">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>{formatPriceLocal(subtotal)}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : formatPriceLocal(shipping)}</span>
                </div>
                <div className="summary-row">
                  <span>Tax</span>
                  <span>{formatPriceLocal(tax)}</span>
                </div>
                {discount > 0 && (
                  <div className="summary-row discount">
                    <span>Discount</span>
                    <span>-{formatPriceLocal(discount)}</span>
                  </div>
                )}
                <div className="summary-row total">
                  <span>Total</span>
                  <span>{formatPriceLocal(total)}</span>
                </div>
              </div>
              
              <div className="order-summary-footer">
                <div className="secure-payment-note">
                  <i className="fas fa-shield-alt"></i>
                  <div>
                    <strong>Secure Checkout</strong>
                    <p>Your payment information is encrypted and secure</p>
                  </div>
                </div>
                
                <div className="delivery-info">
                  <i className="fas fa-truck"></i>
                  <div>
                    <strong>Estimated Delivery</strong>
                    <p>3-5 business days</p>
                  </div>
                </div>
                
                <div className="support-info">
                  <i className="fas fa-headset"></i>
                  <div>
                    <strong>Need Help?</strong>
                    <p>Contact support@driftwear.com</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isSubmitting && (
        <div className="loading-overlay active">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>
              {formData.paymentMethod === 'cod' 
                ? 'Processing your order...' 
                : 'Redirecting to payment gateway...'}
            </p>
            {formData.paymentMethod !== 'cod' && (
              <p className="small">
                You will be redirected to PayMongo secure payment gateway
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Checkout;