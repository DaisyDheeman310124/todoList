const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey123';
const ADMIN_EMAIL = 'amitkumar310124@gmail.com';

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://amitkumar310124_db_user:Amit2300@cluster0.twyfemg.mongodb.net/taskdb';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ MongoDB connected successfully'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

// Models
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user' },
    blocked: { type: Boolean, default: false },
    securityQuestion: { type: String },
    securityAnswer: { type: String }
});

const User = mongoose.model('User', UserSchema);

const TaskSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String },
    completed: { type: Boolean, default: false }
}, { timestamps: true });

const Task = mongoose.model('Task', TaskSchema);

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Access denied' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Admin Middleware
const isAdmin = (req, res, next) => {
    if (req.user.email !== ADMIN_EMAIL) {
        return res.status(403).json({ message: 'Admin access denied' });
    }
    next();
};

// Auth Routes
app.post('/api/register', async (req, res) => {
    try {
        const { email, password, securityQuestion, securityAnswer } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ 
            email, 
            password: hashedPassword, 
            securityQuestion, 
            securityAnswer: securityAnswer.toLowerCase() // Save in lowercase for easier matching
        });
        await user.save();
        res.status(201).json({ message: 'User registered' });
    } catch (err) {
        res.status(400).json({ message: 'Email already exists or DB error' });
    }
});

app.post('/api/login', async (req, res) => {
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

// Forgot Password - Get Question
app.post('/api/forgot-password/question', async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (!user.securityQuestion) return res.status(400).json({ message: 'No security question set' });
        
        res.json({ question: user.securityQuestion });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Reset Password - Verify Answer and Update
app.post('/api/forgot-password/reset', async (req, res) => {
    try {
        const { email, answer, newPassword } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        if (user.securityAnswer !== answer.toLowerCase()) {
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

// Admin Control Routes
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const users = await User.find({ email: { $ne: ADMIN_EMAIL } }, 'email blocked');
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.patch('/api/admin/users/:id/block', authenticateToken, isAdmin, async (req, res) => {
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

app.delete('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        await Task.deleteMany({ userId: req.params.id });
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Protected Task Routes
app.get('/api/tasks', authenticateToken, async (req, res) => {
    try {
        let filter = { userId: req.user.id };
        if (req.user.email === ADMIN_EMAIL) {
            if (req.query.userId) {
                filter = { userId: req.query.userId };
            } else {
                filter = {};
            }
        }
        const tasks = await Task.find(filter).sort({ createdAt: -1 });
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
    try {
        const task = new Task({
            userId: req.user.id,
            title: req.body.title,
            description: req.body.description
        });
        const newTask = await task.save();
        res.status(201).json(newTask);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const query = { _id: req.params.id };
        if (req.user.email !== ADMIN_EMAIL) {
            query.userId = req.user.id;
        }
        const updatedTask = await Task.findOneAndUpdate(query, req.body, { new: true });
        res.json(updatedTask);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
    try {
        const query = { _id: req.params.id };
        if (req.user.email !== ADMIN_EMAIL) {
            query.userId = req.user.id;
        }
        await Task.findOneAndDelete(query);
        res.json({ message: 'Task deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
