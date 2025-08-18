// excel-analytics-backend/models/History.js
const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // <--- ADD THIS LINE
    },
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    details: { type: Object }, // Stores additional information
});

module.exports = mongoose.model('History', HistorySchema);