// excel-analytics-backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware'); // Your existing auth middleware

// Middleware to check if the user is an admin
// This assumes authMiddleware has already run and populated req.user
const isAdmin = (req, res, next) => {
    if (req.user && req.user.isAdmin) {
        next(); // User is an admin, proceed
    } else {
        res.status(403).json({ message: 'Access Denied: Admin privileges required.' });
    }
};

// Route to get all users (protected by authMiddleware and isAdmin)
router.get('/users', authMiddleware, isAdmin, adminController.getAllUsers);

// Route to get all files (protected by authMiddleware and isAdmin)
router.get('/files', authMiddleware, isAdmin, adminController.getAllFiles);

// NEW: Route to delete a user by ID (protected by authMiddleware and isAdmin)
router.delete('/users/:id', authMiddleware, isAdmin, adminController.deleteUser);

module.exports = router;
