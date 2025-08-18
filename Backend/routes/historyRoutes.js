const express = require('express');
const History = require('../models/History');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

//  user history
router.get('/', authMiddleware, async (req, res) => {
    try {
        const history = await History.find({ userId: req.user.id }).sort({ timestamp: -1 });
        res.json({ history });
    } catch (error) {
        res.status(500).json({ message: "Error retrieving history", error: error.message });
    }
});

module.exports = router;
