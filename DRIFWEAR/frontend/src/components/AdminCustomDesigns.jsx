import React, { useState, useEffect } from 'react';

const AdminCustomDesigns = () => {
  const [customDesigns, setCustomDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadCustomDesigns();
  }, []);

  const loadCustomDesigns = () => {
    try {
      const designs = JSON.parse(localStorage.getItem('driftwear_custom_designs') || '[]');
      // Sort by creation date, newest first
      designs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setCustomDesigns(designs);
    } catch (error) {
      console.error('Error loading custom designs:', error);
      setCustomDesigns([]);
    } finally {
      setLoading(false);
    }
  };

  const updateDesignStatus = (designId, newStatus) => {
    try {
      const designs = JSON.parse(localStorage.getItem('driftwear_custom_designs') || '[]');
      const updatedDesigns = designs.map(design => 
        design.adminId === designId ? { ...design, status: newStatus } : design
      );
      localStorage.setItem('driftwear_custom_designs', JSON.stringify(updatedDesigns));
      setCustomDesigns(updatedDesigns);
    } catch (error) {
      console.error('Error updating design status:', error);
    }
  };

  const deleteDesign = (designId) => {
    if (window.confirm('Are you sure you want to delete this custom design?')) {
      try {
        const designs = JSON.parse(localStorage.getItem('driftwear_custom_designs') || '[]');
        const filteredDesigns = designs.filter(design => design.adminId !== designId);
        localStorage.setItem('driftwear_custom_designs', JSON.stringify(filteredDesigns));
        setCustomDesigns(filteredDesigns);
      } catch (error) {
        console.error('Error deleting design:', error);
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ff9800',
      processing: '#2196f3',
      completed: '#4caf50',
      cancelled: '#f44336'
    };
    return colors[status] || '#95a5a6';
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'Pending',
      processing: 'Processing',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    return statusMap[status] || 'Pending';
  };

  const filteredDesigns = customDesigns.filter(design => {
    if (filter === 'all') return true;
    return design.status === filter;
  });

  const getDesignCountByStatus = (status) => {
    return customDesigns.filter(design => design.status === status).length;
  };

  if (loading) {
    return (
      <div className="admin-section">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading custom designs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-section">
      <div className="section-header">
        <h1>Custom Designs</h1>
        <p>Manage customer-created custom designs</p>
        <div className="header-actions">
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({customDesigns.length})
            </button>
            <button 
              className={`filter-tab ${filter === 'pending' ? 'active' : ''}`}
              onClick={() => setFilter('pending')}
            >
              Pending ({getDesignCountByStatus('pending')})
            </button>
            <button 
              className={`filter-tab ${filter === 'processing' ? 'active' : ''}`}
              onClick={() => setFilter('processing')}
            >
              Processing ({getDesignCountByStatus('processing')})
            </button>
            <button 
              className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
            >
              Completed ({getDesignCountByStatus('completed')})
            </button>
          </div>
          <button onClick={loadCustomDesigns} className="btn-refresh">
            <i className="fas fa-sync"></i>
            Refresh
          </button>
        </div>
      </div>

      {customDesigns.length === 0 ? (
        <div className="no-data">
          <i className="fas fa-paint-brush"></i>
          <h3>No Custom Designs Yet</h3>
          <p>Customer-created designs will appear here once they're saved.</p>
          <small>Designs are created through the customization tool on the main site.</small>
        </div>
      ) : (
        <>
          {filteredDesigns.length === 0 ? (
            <div className="no-data">
              <i className="fas fa-filter"></i>
              <h3>No Designs Match Your Filter</h3>
              <p>Try selecting a different filter to see more designs.</p>
            </div>
          ) : (
            <div className="designs-grid">
              {filteredDesigns.map((design) => (
                <div key={design.adminId} className="design-card">
                  <div className="design-preview">
                    <img src={design.image} alt={design.designName} />
                    <div className="design-overlay">
                      <button 
                        className="btn-view"
                        onClick={() => window.open(design.image, '_blank')}
                      >
                        <i className="fas fa-expand"></i>
                        View Full Size
                      </button>
                    </div>
                  </div>
                  
                  <div className="design-info">
                    <div className="design-header">
                      <h4>{design.designName}</h4>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(design.status) }}
                      >
                        {getStatusText(design.status)}
                      </span>
                    </div>
                    
                    <p className="design-description">
                      {design.designDescription || 'No description provided'}
                    </p>
                    
                    <div className="design-meta">
                      <div className="meta-item">
                        <strong>Product Type:</strong> 
                        <span className="text-capitalize">{design.productType}</span>
                      </div>
                      <div className="meta-item">
                        <strong>Customer:</strong> {design.customer}
                      </div>
                      <div className="meta-item">
                        <strong>Email:</strong> {design.customerEmail}
                      </div>
                      <div className="meta-item">
                        <strong>Price:</strong> ₱{design.price?.toLocaleString() || '3,000'}
                      </div>
                      <div className="meta-item">
                        <strong>Created:</strong> {new Date(design.createdAt).toLocaleDateString()}
                      </div>
                      {design.designSide && (
                        <div className="meta-item">
                          <strong>Design Side:</strong> 
                          <span className="text-capitalize">{design.designSide}</span>
                        </div>
                      )}
                    </div>

                    <div className="design-actions">
                      <div className="status-control">
                        <label>Update Status:</label>
                        <select 
                          value={design.status || 'pending'}
                          onChange={(e) => updateDesignStatus(design.adminId, e.target.value)}
                          className="status-select"
                          style={{ borderColor: getStatusColor(design.status) }}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                      
                      <div className="action-buttons">
                        <button 
                          className="btn-view-design"
                          onClick={() => window.open(design.image, '_blank')}
                        >
                          <i className="fas fa-eye"></i>
                          View
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => deleteDesign(design.adminId)}
                        >
                          <i className="fas fa-trash"></i>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminCustomDesigns;