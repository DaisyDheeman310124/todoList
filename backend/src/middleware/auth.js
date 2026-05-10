const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey123';
const ADMIN_EMAIL = 'amitkumar310124@gmail.com';

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

const isAdmin = (req, res, next) => {
    if (req.user.email !== ADMIN_EMAIL) {
        return res.status(403).json({ message: 'Admin access denied' });
    }
    next();
};

module.exports = { authenticateToken, isAdmin, JWT_SECRET, ADMIN_EMAIL };
