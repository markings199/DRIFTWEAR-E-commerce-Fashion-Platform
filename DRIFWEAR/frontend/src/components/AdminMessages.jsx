import React, { useState, useEffect } from 'react';
import { messageService } from '../services/message.service';
import '../css/AdminMessages.css';

const AdminMessages = () => {
  const [messages, setMessages] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = () => {
    try {
      setLoading(true);
      const realMessages = messageService.getAllMessages();
      setMessages(realMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectConversation = (message) => {
    setSelectedConversation(message);
    setReplyText('');
    
    // Mark as read when selected
    if (message.status === 'unread') {
      messageService.markAsRead(message.id);
      const updatedMessages = messages.map(msg =>
        msg.id === message.id ? { ...msg, status: 'read' } : msg
      );
      setMessages(updatedMessages);
    }
  };

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedConversation) return;

    const result = messageService.addReply(selectedConversation.id, {
      senderName: 'Admin',
      senderType: 'admin',
      message: replyText
    });

    if (result.status === 'success') {
      setReplyText('');
      // Reload the conversation
      const updatedConversation = messageService.getConversation(selectedConversation.id);
      setSelectedConversation(updatedConversation);
      loadMessages();
    } else {
      alert('Failed to send reply. Please try again.');
    }
  };

  const handleMarkAsResolved = (messageId) => {
    const result = messageService.updateMessage(messageId, { status: 'resolved' });
    
    if (result.status === 'success') {
      const updatedMessages = messages.map(msg =>
        msg.id === messageId ? { ...msg, status: 'resolved' } : msg
      );
      setMessages(updatedMessages);
      
      if (selectedConversation && selectedConversation.id === messageId) {
        setSelectedConversation({ ...selectedConversation, status: 'resolved' });
      }
    }
  };

  const handleDeleteMessage = (messageId) => {
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      const result = messageService.deleteMessage(messageId);
      
      if (result.status === 'success') {
        const updatedMessages = messages.filter(msg => msg.id !== messageId);
        setMessages(updatedMessages);
        
        if (selectedConversation && selectedConversation.id === messageId) {
          setSelectedConversation(null);
        }
      }
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#f44336';
      case 'medium': return '#ff9800';
      case 'low': return '#4caf50';
      default: return '#757575';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'unread': return '#f44336';
      case 'read': return '#2196f3';
      case 'replied': return '#ff9800';
      case 'resolved': return '#4caf50';
      default: return '#757575';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredMessages = () => {
    let filtered = messages;

    if (activeFilter !== 'all') {
      filtered = filtered.filter(msg => msg.status === activeFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(msg =>
        msg.userName.toLowerCase().includes(term) ||
        msg.userEmail.toLowerCase().includes(term) ||
        msg.subject.toLowerCase().includes(term) ||
        msg.message.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const filteredMessages = getFilteredMessages();

  const getStatusCount = (status) => {
    return messages.filter(msg => msg.status === status).length;
  };

  if (loading) {
    return (
      <div className="admin-messages">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-messages">
      <div className="messages-header">
        <div className="header-content">
          <h1>Customer Messages</h1>
          <p>Manage and respond to customer inquiries and support requests</p>
        </div>
        <div className="header-stats">
          <div className="stat">
            <span className="stat-number">{getStatusCount('unread')}</span>
            <span className="stat-label">Unread</span>
          </div>
          <div className="stat">
            <span className="stat-number">{getStatusCount('replied')}</span>
            <span className="stat-label">Replied</span>
          </div>
          <div className="stat">
            <span className="stat-number">{messages.length}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>
      </div>

      <div className="messages-content">
        {/* Conversations List */}
        <div className="conversations-list">
          <div className="conversations-filters">
            <div className="search-box">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="filter-buttons">
              <button 
                className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                All
              </button>
              <button 
                className={`filter-btn ${activeFilter === 'unread' ? 'active' : ''}`}
                onClick={() => setActiveFilter('unread')}
              >
                Unread ({getStatusCount('unread')})
              </button>
              <button 
                className={`filter-btn ${activeFilter === 'replied' ? 'active' : ''}`}
                onClick={() => setActiveFilter('replied')}
              >
                Replied ({getStatusCount('replied')})
              </button>
              <button 
                className={`filter-btn ${activeFilter === 'resolved' ? 'active' : ''}`}
                onClick={() => setActiveFilter('resolved')}
              >
                Resolved ({getStatusCount('resolved')})
              </button>
            </div>
          </div>

          <div className="conversations-container">
            {filteredMessages.length === 0 ? (
              <div className="no-conversations">
                <i className="fas fa-comments"></i>
                <h3>No conversations found</h3>
                <p>No customer messages match your current filters.</p>
              </div>
            ) : (
              filteredMessages.map(message => (
                <div
                  key={message.id}
                  className={`conversation-item ${selectedConversation?.id === message.id ? 'active' : ''} ${message.status}`}
                  onClick={() => handleSelectConversation(message)}
                >
                  <div className="conversation-header">
                    <div className="user-info">
                      <div className="user-avatar">
                        {message.userName.charAt(0).toUpperCase()}
                      </div>
                      <div className="user-details">
                        <h4>{message.userName}</h4>
                        <span className="user-email">{message.userEmail}</span>
                      </div>
                    </div>
                    <div className="conversation-meta">
                      <span className="conversation-date">
                        {formatDate(message.timestamp)}
                      </span>
                      <span 
                        className="priority-badge"
                        style={{ backgroundColor: getPriorityColor(message.priority) }}
                      >
                        {message.priority}
                      </span>
                    </div>
                  </div>
                  
                  <div className="conversation-preview">
                    <h5 className="conversation-subject">{message.subject}</h5>
                    <p className="conversation-excerpt">
                      {message.replies.length > 0 
                        ? `Latest: ${message.replies[message.replies.length - 1].message}`
                        : message.message
                      }
                    </p>
                  </div>
                  
                  <div className="conversation-footer">
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(message.status) }}
                    >
                      {message.status}
                    </span>
                    {message.orderId && (
                      <span className="order-reference">
                        Order: {message.orderId}
                      </span>
                    )}
                    {message.replies.length > 0 && (
                      <span className="reply-count">
                        <i className="fas fa-reply"></i>
                        {message.replies.length} {message.replies.length === 1 ? 'reply' : 'replies'}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="chat-area">
          {selectedConversation ? (
            <div className="chat-container">
              <div className="chat-header">
                <div className="chat-info">
                  <h2>{selectedConversation.subject}</h2>
                  <div className="chat-meta">
                    <div className="user-info">
                      <div className="user-avatar large">
                        {selectedConversation.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4>{selectedConversation.userName}</h4>
                        <span className="user-email">{selectedConversation.userEmail}</span>
                      </div>
                    </div>
                    <div className="chat-details">
                      <span 
                        className="priority-badge"
                        style={{ backgroundColor: getPriorityColor(selectedConversation.priority) }}
                      >
                        {selectedConversation.priority} priority
                      </span>
                      {selectedConversation.orderId && (
                        <span className="order-reference">
                          Order: {selectedConversation.orderId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="chat-actions">
                  {selectedConversation.status !== 'resolved' && (
                    <button 
                      className="btn-resolve"
                      onClick={() => handleMarkAsResolved(selectedConversation.id)}
                    >
                      <i className="fas fa-check"></i>
                      Mark Resolved
                    </button>
                  )}
                  <button 
                    className="btn-delete"
                    onClick={() => handleDeleteMessage(selectedConversation.id)}
                  >
                    <i className="fas fa-trash"></i>
                    Delete
                  </button>
                </div>
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

              <div className="reply-section">
                <div className="message-input">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Type your response here..."
                    rows="3"
                  />
                  <button 
                    className="btn-send"
                    onClick={handleSendReply}
                    disabled={!replyText.trim()}
                  >
                    <i className="fas fa-paper-plane"></i>
                    Send Reply
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-conversation-selected">
              <i className="fas fa-comment-alt"></i>
              <h3>Select a conversation</h3>
              <p>Choose a customer conversation from the list to view messages and respond.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;