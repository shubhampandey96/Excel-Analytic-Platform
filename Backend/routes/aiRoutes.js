const express = require('express');
const { askGemini } = require('../services/geminiAI');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/analyze', authMiddleware, async (req, res) => {
    const { query } = req.body;
    if (!query) return res.status(400).json({ message: "Query required" });

    const aiResponse = await askGemini(query);
    res.json({ result: aiResponse });
});

module.exports = router;
