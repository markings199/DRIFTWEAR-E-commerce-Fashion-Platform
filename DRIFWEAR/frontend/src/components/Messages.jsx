import React, { useState, useEffect } from 'react';
import '../css/Messages.css';

const Messages = ({ currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [activeTab, setActiveTab] = useState('inbox');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = () => {
    // Mock data - replace with actual API calls
    const mockMessages = [
      {
        id: 1,
        sender: 'customer123',
        senderName: 'John Doe',
        subject: 'Order Delivery Issue',
        message: 'Hi, my order #DW-12345 hasn\'t arrived yet. It was supposed to be delivered 3 days ago. Can you check the status?',
        timestamp: new Date('2024-01-15T10:30:00'),
        read: false,
        type: 'inquiry',
        orderId: 'DW-12345'
      },
      {
        id: 2,
        sender: 'customer456',
        senderName: 'Sarah Smith',
        subject: 'Product Return Request',
        message: 'I would like to return a sweater I purchased last week. It doesn\'t fit as expected.',
        timestamp: new Date('2024-01-14T14:20:00'),
        read: true,
        type: 'return',
        orderId: 'DW-12346'
      },
      {
        id: 3,
        sender: 'customer789',
        senderName: 'Mike Johnson',
        subject: 'Size Recommendation',
        message: 'Can you help me choose the right size for the Classic Fit T-Shirt? I\'m 6ft tall and 180lbs.',
        timestamp: new Date('2024-01-13T09:15:00'),
        read: true,
        type: 'inquiry'
      }
    ];
    
    setMessages(mockMessages);
    setLoading(false);
  };

  const handleSelectMessage = (message) => {
    setSelectedMessage(message);
    // Mark as read
    if (!message.read) {
      setMessages(prev => prev.map(msg => 
        msg.id === message.id ? { ...msg, read: true } : msg
      ));
    }
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedMessage) return;

    const newReply = {
      id: Date.now(),
      sender: 'admin',
      senderName: 'DRIFTWEAR Support',
      message: replyText,
      timestamp: new Date(),
      isReply: true
    };

    // In a real app, you would send this to your backend
    console.log('Sending reply:', newReply);
    
    setReplyText('');
    alert('Reply sent successfully!');
  };

  const getFilteredMessages = () => {
    switch (activeTab) {
      case 'unread':
        return messages.filter(msg => !msg.read);
      case 'inquiries':
        return messages.filter(msg => msg.type === 'inquiry');
      case 'returns':
        return messages.filter(msg => msg.type === 'return');
      default:
        return messages;
    }
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

  const unreadCount = messages.filter(msg => !msg.read).length;

  if (loading) {
    return (
      <div className="messages-loading">
        <div className="loading-spinner"></div>
        <p>Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="messages-page">
      <div className="messages-container">
        {/* Header */}
        <div className="messages-header">
          <h1>Customer Messages</h1>
          <div className="messages-stats">
            <span className="stat">
              <i className="fas fa-inbox"></i>
              Total: {messages.length}
            </span>
            <span className="stat unread">
              <i className="fas fa-envelope"></i>
              Unread: {unreadCount}
            </span>
          </div>
        </div>

        <div className="messages-layout">
          {/* Sidebar */}
          <div className="messages-sidebar">
            <div className="message-filters">
              <button 
                className={`filter-btn ${activeTab === 'inbox' ? 'active' : ''}`}
                onClick={() => setActiveTab('inbox')}
              >
                <i className="fas fa-inbox"></i>
                All Messages
              </button>
              <button 
                className={`filter-btn ${activeTab === 'unread' ? 'active' : ''}`}
                onClick={() => setActiveTab('unread')}
              >
                <i className="fas fa-envelope"></i>
                Unread ({unreadCount})
              </button>
              <button 
                className={`filter-btn ${activeTab === 'inquiries' ? 'active' : ''}`}
                onClick={() => setActiveTab('inquiries')}
              >
                <i className="fas fa-question-circle"></i>
                Inquiries
              </button>
              <button 
                className={`filter-btn ${activeTab === 'returns' ? 'active' : ''}`}
                onClick={() => setActiveTab('returns')}
              >
                <i className="fas fa-undo"></i>
                Returns
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="messages-main">
            {/* Messages List */}
            <div className="messages-list">
              <h3>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h3>
              {getFilteredMessages().length === 0 ? (
                <div className="no-messages">
                  <i className="fas fa-comments"></i>
                  <p>No messages found</p>
                </div>
              ) : (
                getFilteredMessages().map(message => (
                  <div
                    key={message.id}
                    className={`message-item ${selectedMessage?.id === message.id ? 'active' : ''} ${!message.read ? 'unread' : ''}`}
                    onClick={() => handleSelectMessage(message)}
                  >
                    <div className="message-preview">
                      <div className="message-sender">
                        <strong>{message.senderName}</strong>
                        {!message.read && <span className="unread-dot"></span>}
                      </div>
                      <div className="message-subject">{message.subject}</div>
                      <div className="message-excerpt">
                        {message.message.substring(0, 60)}...
                      </div>
                      <div className="message-meta">
                        <span className="message-time">
                          {formatDate(message.timestamp)}
                        </span>
                        {message.orderId && (
                          <span className="order-badge">Order: {message.orderId}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Message Detail */}
            <div className="message-detail">
              {selectedMessage ? (
                <>
                  <div className="message-header">
                    <div className="message-info">
                      <h3>{selectedMessage.subject}</h3>
                      <div className="message-sender-info">
                        From: <strong>{selectedMessage.senderName}</strong>
                        {selectedMessage.orderId && (
                          <span className="order-info">
                            (Order: {selectedMessage.orderId})
                          </span>
                        )}
                      </div>
                      <div className="message-time">
                        {formatDate(selectedMessage.timestamp)}
                      </div>
                    </div>
                    <div className="message-actions">
                      <button className="btn btn-primary">
                        <i className="fas fa-reply"></i>
                        Reply
                      </button>
                      <button className="btn btn-secondary">
                        <i className="fas fa-archive"></i>
                        Archive
                      </button>
                    </div>
                  </div>

                  <div className="message-content">
                    <p>{selectedMessage.message}</p>
                  </div>

                  {/* Reply Section */}
                  <div className="reply-section">
                    <h4>Send Reply</h4>
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your reply here..."
                      rows="4"
                    />
                    <div className="reply-actions">
                      <button 
                        className="btn btn-primary"
                        onClick={handleSendReply}
                        disabled={!replyText.trim()}
                      >
                        <i className="fas fa-paper-plane"></i>
                        Send Reply
                      </button>
                      <button className="btn btn-secondary">
                        <i className="fas fa-times"></i>
                        Cancel
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="no-selection">
                  <i className="fas fa-comment-alt"></i>
                  <p>Select a message to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;