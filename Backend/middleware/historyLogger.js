const History = require('../models/History');

const logHistory = async (req, res, next) => {
    try {
        await History.create({
            userId: req.user.id,  
            action: req.method + " " + req.originalUrl,
            details: req.body,
        });
    } catch (error) {
        console.error("❌ Error logging history:", error);
    }
    next();
};

module.exports = logHistory;
