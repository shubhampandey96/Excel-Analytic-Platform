// backend/utils/historyUtils.js
const History = require('../models/History');

const logAction = async (userId, action, details = {}) => {
    try {
        if (!userId) {
            console.warn(`Attempted to log action "${action}" without a userId. Logging as null.`);
        }
        await History.create({
            userId: userId || null, // <--- CHANGE THIS: Pass null instead of "anonymous"
            action: action,
            details: details,
            timestamp: new Date()
        });
    } catch (error) {
        console.error("❌ Error logging history action:", error);
    }
};

module.exports = { logAction };