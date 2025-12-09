const MESSAGES_KEY = 'driftwear_messages';

export const messageService = {
  // Get all messages from localStorage
  getAllMessages: () => {
    try {
      const messages = localStorage.getItem(MESSAGES_KEY);
      return messages ? JSON.parse(messages) : [];
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  },

  // Save a new message from user
  saveMessage: (messageData) => {
    try {
      const messages = messageService.getAllMessages();
      const newMessage = {
        id: Date.now().toString(),
        userId: messageData.userId,
        userName: messageData.name,
        userEmail: messageData.email,
        subject: messageData.subject,
        message: messageData.message,
        priority: messageData.priority || 'medium',
        orderId: messageData.orderId || null,
        timestamp: new Date().toISOString(),
        status: 'unread',
        type: 'user',
        replies: []
      };
      
      messages.push(newMessage);
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
      return { status: 'success', message: newMessage };
    } catch (error) {
      console.error('Error saving message:', error);
      return { status: 'error', error: 'Failed to send message' };
    }
  },

  // Add reply to message (messenger style)
  addReply: (messageId, replyData) => {
    try {
      const messages = messageService.getAllMessages();
      const updatedMessages = messages.map(msg => {
        if (msg.id === messageId) {
          const newReply = {
            id: Date.now().toString(),
            senderName: replyData.senderName,
            senderType: replyData.senderType,
            message: replyData.message,
            timestamp: new Date().toISOString()
          };
          return {
            ...msg,
            status: replyData.senderType === 'admin' ? 'replied' : 'unread',
            replies: [...msg.replies, newReply]
          };
        }
        return msg;
      });
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(updatedMessages));
      return { status: 'success' };
    } catch (error) {
      console.error('Error adding reply:', error);
      return { status: 'error' };
    }
  },

  // Update message status
  updateMessage: (messageId, updates) => {
    try {
      const messages = messageService.getAllMessages();
      const updatedMessages = messages.map(msg => 
        msg.id === messageId ? { ...msg, ...updates } : msg
      );
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(updatedMessages));
      return { status: 'success' };
    } catch (error) {
      console.error('Error updating message:', error);
      return { status: 'error' };
    }
  },

  // Delete message
  deleteMessage: (messageId) => {
    try {
      const messages = messageService.getAllMessages();
      const filteredMessages = messages.filter(msg => msg.id !== messageId);
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(filteredMessages));
      return { status: 'success' };
    } catch (error) {
      console.error('Error deleting message:', error);
      return { status: 'error' };
    }
  },

  // Get messages by user
  getMessagesByUser: (userId) => {
    const messages = messageService.getAllMessages();
    return messages.filter(msg => msg.userId === userId);
  },

  // Get conversation thread for a specific message
  getConversation: (messageId) => {
    const messages = messageService.getAllMessages();
    return messages.find(msg => msg.id === messageId);
  },

  // Get unread message count
  getUnreadCount: () => {
    const messages = messageService.getAllMessages();
    return messages.filter(msg => msg.status === 'unread').length;
  },

  // Mark message as read
  markAsRead: (messageId) => {
    return messageService.updateMessage(messageId, { status: 'read' });
  },

  // Initialize with sample data if empty (for testing)
  initializeSampleData: () => {
    const existingMessages = messageService.getAllMessages();
    if (existingMessages.length === 0) {
      const sampleMessages = [
        {
          id: '1',
          userId: 'user1',
          userName: 'John Doe',
          userEmail: 'john@example.com',
          subject: 'Order Delivery Question',
          message: 'Hi, I wanted to check when my order #ORD001 will be delivered? I placed the order 3 days ago.',
          priority: 'medium',
          orderId: 'ORD001',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          status: 'unread',
          type: 'user',
          replies: []
        },
        {
          id: '2',
          userId: 'user2',
          userName: 'Sarah Wilson',
          userEmail: 'sarah@example.com',
          subject: 'Product Size Issue',
          message: 'The size I received for my t-shirt seems smaller than expected. I ordered Large but it fits like Medium.',
          priority: 'high',
          orderId: 'ORD002',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          status: 'replied',
          type: 'user',
          replies: [
            {
              id: 'reply1',
              senderName: 'Admin',
              senderType: 'admin',
              message: 'We apologize for the inconvenience. Can you please share your order details and the specific size issue? We\'ll arrange an exchange.',
              timestamp: new Date(Date.now() - 86400000).toISOString()
            }
          ]
        },
        {
          id: '3',
          userId: 'user3',
          userName: 'Mike Johnson',
          userEmail: 'mike@example.com',
          subject: 'Custom Design Inquiry',
          message: 'I want to create a custom design for my team. What are the requirements and pricing?',
          priority: 'low',
          orderId: null,
          timestamp: new Date(Date.now() - 259200000).toISOString(),
          status: 'resolved',
          type: 'user',
          replies: [
            {
              id: 'reply2',
              senderName: 'Admin',
              senderType: 'admin',
              message: 'Thank you for your interest! We offer custom design services starting at $49.99. Please share your design requirements.',
              timestamp: new Date(Date.now() - 172800000).toISOString()
            },
            {
              id: 'reply3',
              senderName: 'Mike Johnson',
              senderType: 'user',
              message: 'Thanks! I\'ll send the design files soon.',
              timestamp: new Date(Date.now() - 86400000).toISOString()
            }
          ]
        }
      ];
      localStorage.setItem(MESSAGES_KEY, JSON.stringify(sampleMessages));
      return sampleMessages;
    }
    return existingMessages;
  }
};