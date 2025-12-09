import React, { useState, useEffect } from 'react';
import '../css/Orders.css';

const Orders = ({ currentUser }) => {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = () => {
    // Mock data - replace with actual API calls
    const mockOrders = [
      {
        id: 'DW-12345',
        customer: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1 (555) 123-4567'
        },
        items: [
          {
            id: 1,
            name: 'Classic Fit T-Shirt',
            price: 29.99,
            quantity: 2,
            size: 'M',
            color: 'Black',
            image: '/images/women1.jpeg'
          },
          {
            id: 2,
            name: 'Slim Fit Jeans',
            price: 49.99,
            quantity: 1,
            size: '32',
            color: 'Dark Blue',
            image: '/images/women2.jpeg'
          }
        ],
        total: 109.97,
        status: 'processing',
        paymentStatus: 'paid',
        shippingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        createdAt: new Date('2024-01-15T10:30:00'),
        updatedAt: new Date('2024-01-15T10:30:00')
      },
      {
        id: 'DW-12346',
        customer: {
          name: 'Sarah Smith',
          email: 'sarah@example.com',
          phone: '+1 (555) 987-6543'
        },
        items: [
          {
            id: 3,
            name: 'Hooded Jacket',
            price: 79.99,
            quantity: 1,
            size: 'L',
            color: 'Navy',
            image: '/images/women3.jpeg'
          }
        ],
        total: 79.99,
        status: 'shipped',
        paymentStatus: 'paid',
        shippingAddress: {
          street: '456 Oak Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        createdAt: new Date('2024-01-14T14:20:00'),
        updatedAt: new Date('2024-01-15T09:15:00')
      },
      {
        id: 'DW-12347',
        customer: {
          name: 'Mike Johnson',
          email: 'mike@example.com',
          phone: '+1 (555) 456-7890'
        },
        items: [
          {
            id: 4,
            name: 'Casual Linen Shirt',
            price: 44.99,
            quantity: 1,
            size: 'M',
            color: 'White',
            image: '/images/women4.jpeg'
          }
        ],
        total: 44.99,
        status: 'delivered',
        paymentStatus: 'paid',
        shippingAddress: {
          street: '789 Pine Rd',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601',
          country: 'USA'
        },
        createdAt: new Date('2024-01-13T09:15:00'),
        updatedAt: new Date('2024-01-14T16:45:00')
      }
    ];

    setOrders(mockOrders);
    setLoading(false);
  };

  const handleStatusUpdate = (orderId, newStatus) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus, updatedAt: new Date() }
        : order
    ));
    
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => ({ ...prev, status: newStatus }));
    }
    
    alert(`Order ${orderId} status updated to ${newStatus}`);
  };

  const getFilteredOrders = () => {
    let filtered = orders;

    // Apply status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(order => order.status === activeFilter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f39c12',
      processing: '#3498db',
      shipped: '#9b59b6',
      delivered: '#27ae60',
      cancelled: '#e74c3c'
    };
    return colors[status] || '#95a5a6';
  };

  const getStatusOptions = (currentStatus) => {
    const statusFlow = {
      pending: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: []
    };
    return statusFlow[currentStatus] || [];
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getOrderStats = () => {
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length
    };
    return stats;
  };

  const stats = getOrderStats();

  if (loading) {
    return (
      <div className="orders-loading">
        <div className="loading-spinner"></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-container">
        {/* Header */}
        <div className="orders-header">
          <h1>Order Management</h1>
          <div className="orders-stats">
            <div className="stat-card">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Total Orders</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.processing}</div>
              <div className="stat-label">Processing</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.shipped}</div>
              <div className="stat-label">Shipped</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.delivered}</div>
              <div className="stat-label">Delivered</div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="orders-controls">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search orders by ID, customer name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-buttons">
            <button 
              className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All ({stats.total})
            </button>
            <button 
              className={`filter-btn ${activeFilter === 'pending' ? 'active' : ''}`}
              onClick={() => setActiveFilter('pending')}
            >
              Pending ({stats.pending})
            </button>
            <button 
              className={`filter-btn ${activeFilter === 'processing' ? 'active' : ''}`}
              onClick={() => setActiveFilter('processing')}
            >
              Processing ({stats.processing})
            </button>
            <button 
              className={`filter-btn ${activeFilter === 'shipped' ? 'active' : ''}`}
              onClick={() => setActiveFilter('shipped')}
            >
              Shipped ({stats.shipped})
            </button>
            <button 
              className={`filter-btn ${activeFilter === 'delivered' ? 'active' : ''}`}
              onClick={() => setActiveFilter('delivered')}
            >
              Delivered ({stats.delivered})
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="orders-list">
          {getFilteredOrders().length === 0 ? (
            <div className="no-orders">
              <i className="fas fa-box-open"></i>
              <p>No orders found</p>
            </div>
          ) : (
            getFilteredOrders().map(order => (
              <div
                key={order.id}
                className={`order-card ${selectedOrder?.id === order.id ? 'active' : ''}`}
                onClick={() => setSelectedOrder(order)}
              >
                <div className="order-header">
                  <div className="order-info">
                    <h3>Order {order.id}</h3>
                    <div className="customer-info">
                      {order.customer.name} • {order.customer.email}
                    </div>
                  </div>
                  <div className="order-meta">
                    <div 
                      className="order-status"
                      style={{ backgroundColor: getStatusColor(order.status) }}
                    >
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </div>
                    <div className="order-total">
                      {formatPrice(order.total)}
                    </div>
                    <div className="order-date">
                      {formatDate(order.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="order-items-preview">
                  {order.items.slice(0, 2).map((item, index) => (
                    <div key={index} className="order-item-preview">
                      <img src={item.image} alt={item.name} />
                      <span>{item.name} (x{item.quantity})</span>
                    </div>
                  ))}
                  {order.items.length > 2 && (
                    <div className="more-items">
                      +{order.items.length - 2} more items
                    </div>
                  )}
                </div>

                <div className="order-actions">
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button 
                    className="btn btn-secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrder(order);
                    }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Order Details Sidebar */}
        {selectedOrder && (
          <div className="order-detail-sidebar">
            <div className="sidebar-header">
              <h3>Order Details</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedOrder(null)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="order-detail-content">
              <div className="detail-section">
                <h4>Order Information</h4>
                <div className="detail-item">
                  <span>Order ID:</span>
                  <strong>{selectedOrder.id}</strong>
                </div>
                <div className="detail-item">
                  <span>Status:</span>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(selectedOrder.status) }}
                  >
                    {selectedOrder.status}
                  </span>
                </div>
                <div className="detail-item">
                  <span>Order Date:</span>
                  <span>{formatDate(selectedOrder.createdAt)}</span>
                </div>
                <div className="detail-item">
                  <span>Last Updated:</span>
                  <span>{formatDate(selectedOrder.updatedAt)}</span>
                </div>
              </div>

              <div className="detail-section">
                <h4>Customer Information</h4>
                <div className="detail-item">
                  <span>Name:</span>
                  <span>{selectedOrder.customer.name}</span>
                </div>
                <div className="detail-item">
                  <span>Email:</span>
                  <span>{selectedOrder.customer.email}</span>
                </div>
                <div className="detail-item">
                  <span>Phone:</span>
                  <span>{selectedOrder.customer.phone}</span>
                </div>
              </div>

              <div className="detail-section">
                <h4>Shipping Address</h4>
                <div className="address">
                  <p>{selectedOrder.shippingAddress.street}</p>
                  <p>
                    {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}
                  </p>
                  <p>{selectedOrder.shippingAddress.country}</p>
                </div>
              </div>

              <div className="detail-section">
                <h4>Order Items</h4>
                <div className="order-items-detail">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="order-item-detail">
                      <img src={item.image} alt={item.name} />
                      <div className="item-info">
                        <div className="item-name">{item.name}</div>
                        <div className="item-meta">
                          Size: {item.size} | Color: {item.color}
                        </div>
                        <div className="item-price">
                          {formatPrice(item.price)} × {item.quantity}
                        </div>
                      </div>
                      <div className="item-total">
                        {formatPrice(item.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="order-total-detail">
                  <strong>Total: {formatPrice(selectedOrder.total)}</strong>
                </div>
              </div>

              <div className="detail-section">
                <h4>Update Status</h4>
                <select
                  value={selectedOrder.status}
                  onChange={(e) => handleStatusUpdate(selectedOrder.id, e.target.value)}
                  className="status-select"
                >
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;