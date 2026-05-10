const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Task = require('../models/Task');
const { authenticateToken, isAdmin, ADMIN_EMAIL } = require('../middleware/auth');

// Get all users
router.get('/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const users = await User.find({ email: { $ne: ADMIN_EMAIL } }, 'email blocked');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Block/Unblock user
router.patch('/users/:id/block', authenticateToken, isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.blocked = !user.blocked;
            await user.save();
            res.json({ message: `User ${user.blocked ? 'blocked' : 'unblocked'}` });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete user
router.delete('/users/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        await Task.deleteMany({ userId: req.params.id });
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
