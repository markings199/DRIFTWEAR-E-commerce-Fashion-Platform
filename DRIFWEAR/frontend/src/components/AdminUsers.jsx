import React, { useState, useEffect } from 'react';
import adminService from '../services/admin.service';
import '../css/AdminUsers.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userOrders, setUserOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);

  useEffect(() => {
    loadUsers();
    loadAllOrders();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const allUsers = await adminService.getAllCustomers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAllOrders = () => {
    try {
      // Load all orders from global storage
      const globalOrdersKey = 'driftwear_all_orders';
      const allOrdersData = JSON.parse(localStorage.getItem(globalOrdersKey) || '[]');
      setAllOrders(allOrdersData);
      
      // Also load from individual user order keys
      const users = JSON.parse(localStorage.getItem('driftwear_users') || '[]');
      let combinedOrders = [...allOrdersData];
      
      users.forEach(user => {
        const userOrdersKey = `driftwear_orders_${user.id}`;
        const userOrders = JSON.parse(localStorage.getItem(userOrdersKey) || '[]');
        userOrders.forEach(order => {
          if (!combinedOrders.some(o => o.id === order.id)) {
            combinedOrders.push({
              ...order,
              customerId: user.id,
              customerName: user.name,
              customerEmail: user.email
            });
          }
        });
      });
      
      setAllOrders(combinedOrders);
    } catch (error) {
      console.error('Error loading all orders:', error);
      setAllOrders([]);
    }
  };

  const loadUserOrders = async (userId) => {
    try {
      // First try to get orders from user's specific storage
      const userOrdersKey = `driftwear_orders_${userId}`;
      let orders = JSON.parse(localStorage.getItem(userOrdersKey) || '[]');
      
      // Also get orders from global storage for this user
      const globalOrders = allOrders.filter(order => 
        order.customerId === userId || order.userId === userId
      );
      
      // Combine and remove duplicates
      const allUserOrders = [...orders, ...globalOrders];
      const uniqueOrders = Array.from(new Map(allUserOrders.map(order => [order.id, order])).values());
      
      // Sort by date (newest first)
      uniqueOrders.sort((a, b) => 
        new Date(b.createdAt || b.orderDate) - new Date(a.createdAt || a.orderDate)
      );
      
      setUserOrders(uniqueOrders);
    } catch (error) {
      console.error('Error loading user orders:', error);
      setUserOrders([]);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
    loadUserOrders(user.id);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price || 0);
  };

  const getFilteredUsers = () => {
    if (!searchTerm) return users;
    
    return users.filter(user => 
      (user.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
  };

  const getUserStats = (userId) => {
    // Get all orders for this user
    const userOrdersKey = `driftwear_orders_${userId}`;
    const userSpecificOrders = JSON.parse(localStorage.getItem(userOrdersKey) || '[]');
    
    // Also get orders from global storage for this user
    const globalUserOrders = allOrders.filter(order => 
      order.customerId === userId || order.userId === userId
    );
    
    // Combine and remove duplicates
    const allUserOrders = [...userSpecificOrders, ...globalUserOrders];
    const uniqueOrders = Array.from(new Map(allUserOrders.map(order => [order.id, order])).values());
    
    // Calculate statistics
    const totalSpent = uniqueOrders.reduce((total, order) => {
      const orderAmount = parseFloat(order.totalAmount || order.amount || order.total || 0);
      return total + orderAmount;
    }, 0);
    
    const completedOrders = uniqueOrders.filter(order => 
      order.status === 'delivered' || order.status === 'completed'
    ).length;
    
    const pendingOrders = uniqueOrders.filter(order => 
      order.status === 'pending' || order.status === 'processing' || order.status === 'pending_payment'
    ).length;
    
    const cancelledOrders = uniqueOrders.filter(order => 
      order.status === 'cancelled'
    ).length;
    
    return {
      totalOrders: uniqueOrders.length,
      completedOrders,
      pendingOrders,
      cancelledOrders,
      totalSpent,
      averageOrderValue: uniqueOrders.length > 0 ? totalSpent / uniqueOrders.length : 0
    };
  };

  const getAllUsersStats = () => {
    const totalUsers = users.length;
    const totalOrders = allOrders.length;
    const totalRevenue = allOrders.reduce((total, order) => {
      return total + parseFloat(order.totalAmount || order.amount || order.total || 0);
    }, 0);
    const averageOrdersPerUser = totalUsers > 0 ? (totalOrders / totalUsers).toFixed(1) : 0;
    
    return {
      totalUsers,
      totalOrders,
      totalRevenue,
      averageOrdersPerUser
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing':
      case 'pending':
      case 'pending_payment':
        return '#3498db';
      case 'shipped':
        return '#9b59b6';
      case 'delivered':
      case 'completed':
        return '#27ae60';
      case 'cancelled':
        return '#e74c3c';
      default:
        return '#f39c12';
    }
  };

  const getStatusText = (order) => {
    const status = order.status || 'pending';
    const paymentStatus = order.paymentStatus || 'pending';
    
    // For online payments with pending status, show as Paid & Processing
    if (paymentStatus === 'pending' && 
        order.paymentMethod && 
        (order.paymentMethod.includes('paymongo') || 
         order.paymentMethod === 'gcash' || 
         order.paymentMethod === 'paymaya' || 
         order.paymentMethod === 'card')) {
      return 'Paid & Processing';
    }
    
    if (paymentStatus === 'pending_cod') {
      return 'Pending (COD)';
    }
    
    if (paymentStatus === 'failed') {
      return 'Payment Failed';
    }
    
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="admin-users-loading">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  const usersWithStats = users.map(user => ({
    ...user,
    stats: getUserStats(user.id)
  }));

  // Sort users by total spent (highest first)
  const sortedUsers = [...usersWithStats].sort((a, b) => b.stats.totalSpent - a.stats.totalSpent);

  const allStats = getAllUsersStats();

  return (
    <div className="admin-users-page">
      <div className="admin-users-container">
        <div className="users-header">
          <h1>Customer Management</h1>
          <p>View and manage all customer accounts</p>
          
          {/* Overall Stats */}
          <div className="overall-stats">
            <div className="overall-stat-card">
              <div className="overall-stat-icon">
                <i className="fas fa-users"></i>
              </div>
              <div className="overall-stat-info">
                <div className="overall-stat-number">{allStats.totalUsers}</div>
                <div className="overall-stat-label">Total Customers</div>
              </div>
            </div>
            <div className="overall-stat-card">
              <div className="overall-stat-icon">
                <i className="fas fa-shopping-bag"></i>
              </div>
              <div className="overall-stat-info">
                <div className="overall-stat-number">{allStats.totalOrders}</div>
                <div className="overall-stat-label">Total Orders</div>
              </div>
            </div>
            <div className="overall-stat-card">
              <div className="overall-stat-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <div className="overall-stat-info">
                <div className="overall-stat-number">{allStats.averageOrdersPerUser}</div>
                <div className="overall-stat-label">Avg Orders/Customer</div>
              </div>
            </div>
            <div className="overall-stat-card">
              <div className="overall-stat-icon">
                <i className="fas fa-money-bill-wave"></i>
              </div>
              <div className="overall-stat-info">
                <div className="overall-stat-number">{formatPrice(allStats.totalRevenue)}</div>
                <div className="overall-stat-label">Total Revenue</div>
              </div>
            </div>
          </div>
        </div>

        <div className="users-content">
          <div className="users-list-section">
            <div className="users-controls">
              <div className="search-box">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Search customers by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="users-stats">
                <span className="total-users">{users.length} Total Customers</span>
                <div className="sort-controls">
                  <span>Sort by:</span>
                  <select 
                    onChange={(e) => {
                      const value = e.target.value;
                      let sorted = [...usersWithStats];
                      if (value === 'totalSpent') {
                        sorted.sort((a, b) => b.stats.totalSpent - a.stats.totalSpent);
                      } else if (value === 'orders') {
                        sorted.sort((a, b) => b.stats.totalOrders - a.stats.totalOrders);
                      } else if (value === 'name') {
                        sorted.sort((a, b) => a.name.localeCompare(b.name));
                      }
                      setUsers(sorted.map(u => ({...u, stats: getUserStats(u.id)})));
                    }}
                    defaultValue="totalSpent"
                  >
                    <option value="totalSpent">Total Spent</option>
                    <option value="orders">Number of Orders</option>
                    <option value="name">Name</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="users-list">
              {getFilteredUsers().length === 0 ? (
                <div className="no-users">
                  <i className="fas fa-users"></i>
                  <h3>No customers found</h3>
                  <p>{searchTerm ? 'Try adjusting your search terms' : 'No customers have registered yet'}</p>
                </div>
              ) : (
                sortedUsers.filter(user => 
                  !searchTerm || 
                  user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  user.email.toLowerCase().includes(searchTerm.toLowerCase())
                ).map(user => {
                  const stats = getUserStats(user.id);
                  const rank = sortedUsers.findIndex(u => u.id === user.id) + 1;
                  
                  return (
                    <div
                      key={user.id}
                      className={`user-card ${selectedUser?.id === user.id ? 'active' : ''}`}
                      onClick={() => handleUserSelect(user)}
                    >
                      <div className="user-rank">
                        #{rank}
                      </div>
                      <div className="user-avatar">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-info">
                        <h4>{user.name}</h4>
                        <p className="user-email">{user.email}</p>
                        <div className="user-meta">
                          <span className="join-date">
                            <i className="fas fa-calendar"></i>
                            Joined {formatDate(user.joinedDate || user.createdAt)}
                          </span>
                          <span className="orders-count">
                            <i className="fas fa-shopping-bag"></i>
                            {stats.totalOrders} orders
                          </span>
                        </div>
                      </div>
                      <div className="user-stats">
                        <div className="stat">
                          <div className="stat-number">{stats.totalOrders}</div>
                          <div className="stat-label">Orders</div>
                        </div>
                        <div className="stat">
                          <div className="stat-number">{stats.completedOrders}</div>
                          <div className="stat-label">Completed</div>
                        </div>
                        <div className="stat">
                          <div className="stat-number main">{formatPrice(stats.totalSpent)}</div>
                          <div className="stat-label">Total Spent</div>
                        </div>
                      </div>
                      <div className="user-actions">
                        <button className="btn-view">
                          <i className="fas fa-eye"></i>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {selectedUser && (
            <div className="user-detail-sidebar">
              <div className="sidebar-header">
                <h3>Customer Details</h3>
                <button 
                  className="close-btn"
                  onClick={() => setSelectedUser(null)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="user-detail-content">
                <div className="user-profile-header">
                  <div className="user-avatar large">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-profile-info">
                    <h4>{selectedUser.name}</h4>
                    <p>{selectedUser.email}</p>
                    <span className="user-id">ID: {selectedUser.id}</span>
                    <div className="user-rank-badge">
                      <i className="fas fa-trophy"></i>
                      #{sortedUsers.findIndex(u => u.id === selectedUser.id) + 1} Top Spender
                    </div>
                  </div>
                </div>

                <div className="user-stats-grid">
                  <div className="user-stat-card">
                    <div className="user-stat-icon">
                      <i className="fas fa-shopping-bag"></i>
                    </div>
                    <div className="user-stat-info">
                      <div className="user-stat-number">{getUserStats(selectedUser.id).totalOrders}</div>
                      <div className="user-stat-label">Total Orders</div>
                      <div className="user-stat-sub">
                        {getUserStats(selectedUser.id).completedOrders} completed
                      </div>
                    </div>
                  </div>
                  <div className="user-stat-card">
                    <div className="user-stat-icon">
                      <i className="fas fa-clock"></i>
                    </div>
                    <div className="user-stat-info">
                      <div className="user-stat-number">{getUserStats(selectedUser.id).pendingOrders}</div>
                      <div className="user-stat-label">Pending</div>
                      <div className="user-stat-sub">
                        {getUserStats(selectedUser.id).cancelledOrders} cancelled
                      </div>
                    </div>
                  </div>
                  <div className="user-stat-card">
                    <div className="user-stat-icon">
                      <i className="fas fa-dollar-sign"></i>
                    </div>
                    <div className="user-stat-info">
                      <div className="user-stat-number">{formatPrice(getUserStats(selectedUser.id).totalSpent)}</div>
                      <div className="user-stat-label">Total Spent</div>
                      <div className="user-stat-sub">
                        {formatPrice(getUserStats(selectedUser.id).averageOrderValue)} avg/order
                      </div>
                    </div>
                  </div>
                </div>

                <div className="user-detail-section">
                  <h4>Account Information</h4>
                  <div className="detail-item">
                    <span>Member Since:</span>
                    <span>{formatDate(selectedUser.joinedDate || selectedUser.createdAt)}</span>
                  </div>
                  <div className="detail-item">
                    <span>Customer ID:</span>
                    <span className="code">{selectedUser.id}</span>
                  </div>
                  <div className="detail-item">
                    <span>Email:</span>
                    <span>{selectedUser.email}</span>
                  </div>
                  <div className="detail-item">
                    <span>Customer Rank:</span>
                    <span className="rank-badge">
                      #{sortedUsers.findIndex(u => u.id === selectedUser.id) + 1} of {users.length}
                    </span>
                  </div>
                </div>

                <div className="user-detail-section">
                  <div className="section-header">
                    <h4>Recent Orders</h4>
                    <span className="order-count">Total: {getUserStats(selectedUser.id).totalOrders}</span>
                  </div>
                  <div className="user-orders-list">
                    {userOrders.length === 0 ? (
                      <div className="no-orders">
                        <i className="fas fa-box-open"></i>
                        <p>No orders found</p>
                      </div>
                    ) : (
                      userOrders.slice(0, 5).map(order => (
                        <div key={order.id} className="user-order-item">
                          <div className="order-info">
                            <strong>Order {order.orderNumber || order.id?.slice(-8)}</strong>
                            <span>{formatDate(order.createdAt || order.orderDate)}</span>
                            <div className="order-payment-method">
                              {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 
                               order.paymentMethod === 'gcash' ? 'GCash' :
                               order.paymentMethod === 'paymaya' ? 'PayMaya' : 
                               order.paymentMethod === 'card' ? 'Credit/Debit Card' : 
                               'Online Payment'}
                            </div>
                          </div>
                          <div className="order-meta">
                            <span className="amount">{formatPrice(order.totalAmount || order.amount)}</span>
                            <span 
                              className="status"
                              style={{ backgroundColor: getStatusColor(order.status) }}
                            >
                              {getStatusText(order)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {userOrders.length > 5 && (
                    <button className="btn-view-all">
                      View All Orders ({userOrders.length})
                    </button>
                  )}
                </div>
                
                <div className="user-detail-section">
                  <h4>Spending Summary</h4>
                  <div className="spending-summary">
                    <div className="summary-item">
                      <span>Total Orders:</span>
                      <span>{getUserStats(selectedUser.id).totalOrders}</span>
                    </div>
                    <div className="summary-item">
                      <span>Completed Orders:</span>
                      <span>{getUserStats(selectedUser.id).completedOrders}</span>
                    </div>
                    <div className="summary-item">
                      <span>Pending Orders:</span>
                      <span>{getUserStats(selectedUser.id).pendingOrders}</span>
                    </div>
                    <div className="summary-item">
                      <span>Cancelled Orders:</span>
                      <span>{getUserStats(selectedUser.id).cancelledOrders}</span>
                    </div>
                    <div className="summary-item">
                      <span>Total Amount Spent:</span>
                      <span className="total-amount">{formatPrice(getUserStats(selectedUser.id).totalSpent)}</span>
                    </div>
                    <div className="summary-item">
                      <span>Average Order Value:</span>
                      <span>{formatPrice(getUserStats(selectedUser.id).averageOrderValue)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;