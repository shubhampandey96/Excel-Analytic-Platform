// excel-analytics-backend/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    isAdmin: {
        type: Boolean,
        default: false // Default to false if not explicitly set
    }
}, { timestamps: true }); // <-- ADD THIS: Mongoose will automatically add createdAt and updatedAt fields

module.exports = mongoose.model('User', UserSchema);
