const Message = require('../models/Message');
const User = require('../models/User');

// Get all messages for a user
const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }]
    })
      .populate('sender', 'name email')
      .populate('receiver', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching messages' });
  }
};

// Get single message
const getMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('sender', 'name email')
      .populate('receiver', 'name email');
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    // Check if user is sender or receiver
    if (message.sender._id.toString() !== req.user._id.toString() && 
        message.receiver._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Mark as read if receiver is viewing
    if (message.receiver._id.toString() === req.user._id.toString() && !message.read) {
      message.read = true;
      await message.save();
    }
    
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching message' });
  }
};

// Send new message
const sendMessage = async (req, res) => {
  try {
    const { receiverId, subject, content } = req.body;
    
    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: 'Receiver not found' });
    }
    
    const message = new Message({
      sender: req.user._id,
      receiver: receiverId,
      subject,
      content
    });
    
    await message.save();
    
    // Populate sender and receiver details
    await message.populate('sender', 'name email');
    await message.populate('receiver', 'name email');
    
    res.status(201).json({ message: 'Message sent successfully', message: message });
  } catch (error) {
    res.status(500).json({ error: 'Error sending message' });
  }
};

// Get unread message count
const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiver: req.user._id,
      read: false
    });
    
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching unread count' });
  }
};

module.exports = {
  getMessages,
  getMessage,
  sendMessage,
  getUnreadCount
};