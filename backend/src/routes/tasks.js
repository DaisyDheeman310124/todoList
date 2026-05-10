const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const { authenticateToken, ADMIN_EMAIL } = require('../middleware/auth');

// Get all tasks
router.get('/', authenticateToken, async (req, res) => {
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
        // Handle legacy tasks without status
        const sanitizedTasks = tasks.map(task => {
            if (!task.status) task.status = 'todo';
            return task;
        });
        res.json(sanitizedTasks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add task
router.post('/', authenticateToken, async (req, res) => {
    try {
        const task = new Task({
            userId: req.user.id,
            title: req.body.title,
            description: req.body.description,
            priority: req.body.priority || 'medium',
            status: req.body.status || 'todo'
        });
        const newTask = await task.save();
        res.status(201).json(newTask);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update task
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        console.log('Updating Task ID:', req.params.id);
        console.log('Update Body:', req.body);
        
        const query = { _id: req.params.id };
        if (req.user.email !== ADMIN_EMAIL) {
            query.userId = req.user.id;
        }

        const updatedTask = await Task.findOneAndUpdate(query, req.body, { new: true });
        if (!updatedTask) {
            return res.status(404).json({ message: 'Task not found or unauthorized' });
        }
        
        console.log('✅ Task Updated Successfully:', updatedTask.status);
        res.json(updatedTask);
    } catch (err) {
        console.error('❌ Update Error:', err.message);
        res.status(400).json({ message: err.message });
    }
});

// Delete task
router.delete('/:id', authenticateToken, async (req, res) => {
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

module.exports = router;
