const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Save design
router.post('/save', async (req, res) => {
    try {
        const { userId, design } = req.body;
        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        user.designs.push(design);
        await user.save();
        
        res.json({ message: 'Design saved successfully', design });
    } catch (error) {
        res.status(500).json({ error: 'Error saving design' });
    }
});

// Get user designs
router.get('/:userId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        res.json(user.designs);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching designs' });
    }
});

// Delete design
router.delete('/:userId/:designId', async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        user.designs = user.designs.filter(design => design._id.toString() !== req.params.designId);
        await user.save();
        
        res.json({ message: 'Design deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting design' });
    }
});

module.exports = router;