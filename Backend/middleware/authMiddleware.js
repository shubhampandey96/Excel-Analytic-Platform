// excel-analytics-backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const authMiddleware = (req, res, next) => {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if no token
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user information (including isAdmin) to the request object
        req.user = decoded; // The decoded token payload should contain { id: userId, isAdmin: boolean }
        
        next(); // Proceed to the next middleware/route handler
    } catch (err) {
        console.error('Auth middleware error:', err.message);
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = authMiddleware;
