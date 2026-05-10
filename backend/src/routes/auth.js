const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET, ADMIN_EMAIL } = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
    try {
        const { email, password, securityQuestion, securityAnswer } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ 
            email, 
            password: hashedPassword, 
            securityQuestion, 
            securityAnswer: securityAnswer.trim().toLowerCase() 
        });
        await user.save();
        res.status(201).json({ message: 'User registered' });
    } catch (err) {
        res.status(400).json({ message: 'Email already exists or DB error' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });
        
        if (user.blocked) {
            return res.status(403).json({ message: 'Account blocked. Contact Admin.' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET);
        res.json({ token, email: user.email, isAdmin: user.email === ADMIN_EMAIL });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Forgot Password
router.post('/forgot-password/question', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ question: user.securityQuestion });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/forgot-password/reset', async (req, res) => {
    try {
        const { email, answer, newPassword } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        if (user.securityAnswer !== answer.toLowerCase().trim()) {
            return res.status(400).json({ message: 'Incorrect security answer' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        res.json({ message: 'Password reset successful' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
