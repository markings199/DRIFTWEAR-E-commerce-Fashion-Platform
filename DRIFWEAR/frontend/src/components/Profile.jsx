import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { orderService } from '../services/order.service';
import { wishlistService } from '../services/wishlist.service';

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  });
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user, activeTab]);

  const loadProfile = async () => {
    try {
      // Check localStorage directly for App.js format
      const userStr = localStorage.getItem('driftwear_user');
      
      if (!userStr) {
        throw new Error('No user found');
      }
      
      const userData = JSON.parse(userStr);
      setUser(userData);
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        address: userData.address || '',
        city: userData.city || '',
        state: userData.state || '',
        zipCode: userData.zipCode || ''
      });
    } catch (error) {
      console.error('Error loading profile:', error);
      displayToast('Error loading profile. Please log in again.');
      
      // Try to use authService as fallback
      try {
        const userData = await authService.getCurrentUser();
        if (userData) {
          setUser(userData);
          setFormData({
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            address: userData.address || '',
            city: userData.city || '',
            state: userData.state || '',
            zipCode: userData.zipCode || ''
          });
        }
      } catch (authError) {
        console.error('Auth service error:', authError);
        // No user found
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      if (activeTab === 'orders') {
        // Get orders from App.js format
        const userOrders = getUserOrdersForProfile(user.id);
        setOrders(userOrders || []);
      } else if (activeTab === 'wishlist') {
        // Use wishlist service
        const wishlistData = await wishlistService.getWishlist();
        setWishlist(wishlistData || []);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      displayToast('Failed to load data');
      
      if (activeTab === 'orders') {
        setOrders([]);
      } else if (activeTab === 'wishlist') {
        setWishlist([]);
      }
    }
  };

  // Function to get user orders (compatible with App.js)
  const getUserOrdersForProfile = (userId) => {
    try {
      if (!userId) return [];
      
      // Get all orders from App.js format
      const allOrders = getAllOrdersForAdmin();
      const userOrders = allOrders.filter(order => 
        order.customerId === userId || order.userId === userId
      );
      
      return userOrders;
    } catch (error) {
      console.error('Error getting user orders:', error);
      return [];
    }
  };

  // Function to get all orders (compatible with App.js)
  const getAllOrdersForAdmin = () => {
    try {
      let allOrders = [];
      
      // Get global orders
      const globalOrdersKey = 'driftwear_all_orders';
      const globalOrders = JSON.parse(localStorage.getItem(globalOrdersKey) || '[]');
      allOrders = [...globalOrders];
      
      // Get user-specific orders
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
      
      // Get last order
      const lastOrder = JSON.parse(localStorage.getItem('lastOrder') || 'null');
      if (lastOrder && !allOrders.some(o => o.id === lastOrder.id)) {
        allOrders.push({
          ...lastOrder,
          customerId: lastOrder.customerId || user?.id || 'guest',
          customerName: lastOrder.customerName || 'Guest Customer',
          customerEmail: lastOrder.customerEmail || 'guest@example.com'
        });
      }
      
      // Get successful payment orders
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
          customerId: user?.id || 'guest',
          customerName: 'Payment Customer',
          customerEmail: 'payment@example.com'
        });
      }
      
      // Remove duplicates and sort by date
      const uniqueOrders = Array.from(new Map(allOrders.map(order => [order.id, order])).values());
      const sortedOrders = uniqueOrders.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.orderDate || 0);
        const dateB = new Date(b.createdAt || b.orderDate || 0);
        return dateB - dateA;
      });
      
      return sortedOrders;
    } catch (error) {
      console.error('Error getting all orders:', error);
      return [];
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      // Validate required fields
      if (!formData.name.trim() || !formData.email.trim()) {
        displayToast('Name and email are required');
        return;
      }

      // Update using authService
      await authService.updateProfile(formData);
      
      // Update local state
      const updatedUser = { ...user, ...formData };
      setUser(updatedUser);
      
      // Update localStorage (App.js format)
      localStorage.setItem('driftwear_user', JSON.stringify(updatedUser));
      
      setEditMode(false);
      displayToast('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      displayToast('Error updating profile');
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      city: user.city || '',
      state: user.state || '',
      zipCode: user.zipCode || ''
    });
    setEditMode(false);
  };

  const handleRemoveFromWishlist = async (productId) => {
    try {
      await wishlistService.removeFromWishlist(productId);
      setWishlist(prev => prev.filter(item => item.id !== productId));
      displayToast('Item removed from wishlist');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      displayToast('Error removing item');
    }
  };

  const handleLogout = () => {
    // Clear App.js format storage
    localStorage.removeItem('driftwear_user');
    
    // Also clear authService storage if any
    authService.logout();
    
    // Redirect to home
    window.location.href = '/';
  };

  const displayToast = (message) => {
    setToastMessage(message);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 3000);
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
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getOrderStatusColor = (status) => {
    if (!status) return '#6b6b6b';
    switch (status.toLowerCase()) {
      case 'delivered': return '#27ae60';
      case 'shipped': return '#3498db';
      case 'processing': return '#f39c12';
      case 'cancelled': return '#e74c3c';
      default: return '#6b6b6b';
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="container">
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '48px', color: 'var(--brand)' }}></i>
            <p style={{ marginTop: '20px' }}>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-container">
        <div className="container">
          <div style={{ textAlign: 'center', padding: '100px 0' }}>
            <i className="fas fa-user-slash" style={{ fontSize: '64px', color: 'var(--muted)', marginBottom: '20px' }}></i>
            <h2>Please Log In</h2>
            <p>You need to be logged in to view your profile.</p>
            <button 
              className="btn" 
              onClick={() => navigate('/')}
              style={{ marginTop: '20px' }}
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="container">
        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar">
            <i className="fas fa-user-circle"></i>
          </div>
          <div className="profile-info">
            <h1>{user.name || 'User'}</h1>
            <p>{user.email || 'No email provided'}</p>
            <div className="profile-stats">
              <div className="stat">
                <span className="stat-number">{orders.length}</span>
                <span className="stat-label">Orders</span>
              </div>
              <div className="stat">
                <span className="stat-number">{wishlist.length}</span>
                <span className="stat-label">Wishlist</span>
              </div>
              <div className="stat">
                <span className="stat-number">
                  {formatDate(user.createdAt)}
                </span>
                <span className="stat-label">Member Since</span>
              </div>
            </div>
            <div className="profile-actions">
              <button 
                className="btn-outline" 
                onClick={handleLogout}
                style={{ marginTop: '10px' }}
              >
                <i className="fas fa-sign-out-alt"></i> Logout
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="profile-tabs">
          <button 
            className={`profile-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="fas fa-user"></i> Overview
          </button>
          <button 
            className={`profile-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <i className="fas fa-shopping-bag"></i> Orders
          </button>
          <button 
            className={`profile-tab ${activeTab === 'wishlist' ? 'active' : ''}`}
            onClick={() => setActiveTab('wishlist')}
          >
            <i className="fas fa-heart"></i> Wishlist
          </button>
          <button 
            className={`profile-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <i className="fas fa-cog"></i> Settings
          </button>
        </div>

        {/* Tab Content */}
        <div className="profile-content">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="tab-panel">
              <div className="overview-grid">
                <div className="overview-card">
                  <h3>Recent Orders</h3>
                  {orders.slice(0, 3).map(order => (
                    <div key={order.id} className="recent-order">
                      <div className="order-info">
                        <span className="order-id">Order #{order.id || order.orderNumber}</span>
                        <span className="order-date">{formatDate(order.createdAt || order.orderDate)}</span>
                      </div>
                      <div className="order-status" style={{ color: getOrderStatusColor(order.status) }}>
                        {order.status || 'Unknown'}
                      </div>
                      <div className="order-total">{formatPrice(order.total || order.totalAmount)}</div>
                    </div>
                  ))}
                  {orders.length === 0 && (
                    <p className="no-data">No recent orders</p>
                  )}
                  <button 
                    className="btn-outline" 
                    onClick={() => setActiveTab('orders')}
                    style={{ marginTop: '15px' }}
                  >
                    View All Orders
                  </button>
                </div>

                <div className="overview-card">
                  <h3>Wishlist</h3>
                  {wishlist.slice(0, 3).map(item => (
                    <div key={item.id} className="wishlist-item">
                      <img src={item.image} alt={item.name} />
                      <div className="item-info">
                        <span className="item-name">{item.name}</span>
                        <span className="item-price">{formatPrice(item.price)}</span>
                      </div>
                    </div>
                  ))}
                  {wishlist.length === 0 && (
                    <p className="no-data">No items in wishlist</p>
                  )}
                  <button 
                    className="btn-outline" 
                    onClick={() => setActiveTab('wishlist')}
                    style={{ marginTop: '15px' }}
                  >
                    View Wishlist
                  </button>
                </div>

                <div className="overview-card">
                  <h3>Account Details</h3>
                  <div className="account-details">
                    <div className="detail-item">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">{user.name || 'Not set'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{user.email || 'Not set'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Member Since:</span>
                      <span className="detail-value">{formatDate(user.createdAt)}</span>
                    </div>
                  </div>
                  <button 
                    className="btn" 
                    onClick={() => setActiveTab('settings')}
                    style={{ marginTop: '15px' }}
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="tab-panel">
              <h2>Order History</h2>
              {orders.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-shopping-bag" style={{ fontSize: '64px', color: 'var(--muted)', marginBottom: '20px' }}></i>
                  <h3>No Orders Yet</h3>
                  <p>Start shopping to see your orders here.</p>
                  <button 
                    className="btn" 
                    onClick={() => navigate('/products')}
                    style={{ marginTop: '20px' }}
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="orders-list">
                  {orders.map(order => (
                    <div key={order.id} className="order-card">
                      <div className="order-header">
                        <div className="order-meta">
                          <span className="order-id">Order #{order.id || order.orderNumber}</span>
                          <span className="order-date">{formatDate(order.createdAt || order.orderDate)}</span>
                        </div>
                        <div className="order-status" style={{ color: getOrderStatusColor(order.status) }}>
                          {order.status || 'Unknown'}
                        </div>
                      </div>
                      <div className="order-items">
                        {order.items && order.items.map(item => (
                          <div key={item.id} className="order-item">
                            <img src={item.image} alt={item.name} />
                            <div className="item-details">
                              <span className="item-name">{item.name}</span>
                              <span className="item-quantity">Qty: {item.quantity}</span>
                            </div>
                            <span className="item-price">{formatPrice(item.price)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="order-footer">
                        <div className="order-total">
                          Total: {formatPrice(order.total || order.totalAmount)}
                        </div>
                        <button 
                          className="btn-outline"
                          onClick={() => {
                            // Navigate to order confirmation page
                            navigate(`/order-confirmation/${order.id}`);
                          }}
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Wishlist Tab */}
          {activeTab === 'wishlist' && (
            <div className="tab-panel">
              <h2>Your Wishlist</h2>
              {wishlist.length === 0 ? (
                <div className="empty-state">
                  <i className="fas fa-heart" style={{ fontSize: '64px', color: 'var(--muted)', marginBottom: '20px' }}></i>
                  <h3>Your Wishlist is Empty</h3>
                  <p>Save items you love to your wishlist.</p>
                  <button 
                    className="btn" 
                    onClick={() => navigate('/products')}
                    style={{ marginTop: '20px' }}
                  >
                    Browse Products
                  </button>
                </div>
              ) : (
                <div className="wishlist-grid">
                  {wishlist.map(item => (
                    <div key={item.id} className="wishlist-product">
                      <div className="product-image">
                        <img src={item.image} alt={item.name} />
                        <button 
                          className="remove-wishlist"
                          onClick={() => handleRemoveFromWishlist(item.id)}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                      <div className="product-info">
                        <h4 className="product-name">{item.name}</h4>
                        <div className="product-price">{formatPrice(item.price)}</div>
                        <div className="product-actions">
                          <button className="btn-cart">Add to Cart</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="tab-panel">
              <div className="settings-header">
                <h2>Profile Settings</h2>
                {!editMode && (
                  <button 
                    className="btn" 
                    onClick={() => setEditMode(true)}
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              <form onSubmit={handleSaveProfile}>
                <div className="settings-form">
                  <div className="form-section">
                    <h3>Personal Information</h3>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Full Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Email *</label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          disabled={!editMode}
                          required
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        disabled={!editMode}
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    <h3>Shipping Address</h3>
                    <div className="form-group">
                      <label>Address</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        disabled={!editMode}
                      />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>City</label>
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          disabled={!editMode}
                        />
                      </div>
                      <div className="form-group">
                        <label>State</label>
                        <input
                          type="text"
                          name="state"
                          value={formData.state}
                          onChange={handleInputChange}
                          disabled={!editMode}
                        />
                      </div>
                      <div className="form-group">
                        <label>ZIP Code</label>
                        <input
                          type="text"
                          name="zipCode"
                          value={formData.zipCode}
                          onChange={handleInputChange}
                          disabled={!editMode}
                        />
                      </div>
                    </div>
                  </div>

                  {editMode && (
                    <div className="form-actions">
                      <button type="submit" className="btn">Save Changes</button>
                      <button type="button" className="btn-outline" onClick={handleCancelEdit}>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toastVisible && (
        <div className="toast show">
          <i className="fas fa-check-circle"></i>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default Profile;