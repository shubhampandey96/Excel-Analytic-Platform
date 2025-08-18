// excel-analytics-backend/models/File.js
const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    filepath: {
        type: String,
        required: true
    },
    fileMimeType: { // NEW FIELD: To store the MIME type of the uploaded file
        type: String,
        required: true
    },
    data: { // This stores the parsed JSON data from the Excel file
        type: Object,
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    uploadDate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('File', FileSchema);
