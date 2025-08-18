// excel-analytics-backend/controllers/aiController.js
const { GoogleGenerativeAI } = require('@google/generative-ai');
const File = require('../models/File');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
// const csv = require('csv-parser'); // Not directly used for reading file content here
const { Readable } = require('stream');
const XLSX = require('xlsx'); // Import XLSX for Excel parsing

const fileController = require('./fileController');

let io;
exports.setSocketIO = (socketIOInstance) => {
    io = socketIOInstance;
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const emitProgress = (userId, progress, message, result = null) => {
    if (io) {
        io.to(userId).emit('ai_analysis_progress', { progress, message, result });
        console.log(`User ${userId}: AI analysis progress - ${message} (${progress}%)`);
    }
};

exports.analyzeData = async (req, res) => {
    const userId = req.user.id;
    console.log(`DEBUG: aiController.analyzeData - Operating with userId: ${userId}`);

    if (!io) {
        console.error('Socket.IO instance not set in aiController.');
        return res.status(500).json({ message: 'Server error: Socket.IO not initialized.' });
    }

    try {
        emitProgress(userId, 10, 'Fetching most recent file.');

        const recentFile = await fileController.getMostRecentFile(userId);

        if (!recentFile) {
            emitProgress(userId, 0, 'No file found for analysis.', 'No file found for AI analysis. Please upload a file first.');
            return res.status(404).json({ message: 'No file found for analysis.' });
        }

        // FIX: Use recentFile.filepath directly as it's already an absolute path
        const filePath = recentFile.filepath; 
        let fileContent;

        console.log(`DEBUG: aiController - Attempting to read file from path: ${filePath}`); // NEW DEBUG LOG
        console.log(`DEBUG: aiController - File MIME Type: ${recentFile.fileMimeType}`);

        // Handle CSV files
        if (recentFile.fileMimeType === 'text/csv') {
            fileContent = await fs.readFile(filePath, 'utf8');
            console.log(`DEBUG: aiController - Read CSV file content.`);
        }
        // Handle Excel files (.xlsx, .xls)
        else if (recentFile.fileMimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                 recentFile.fileMimeType === 'application/vnd.ms-excel') {
            emitProgress(userId, 20, 'Parsing Excel file for AI analysis...');
            console.log(`DEBUG: aiController - Parsing Excel file for AI analysis.`);

            const excelBuffer = await fs.readFile(filePath);
            const workbook = XLSX.read(excelBuffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            fileContent = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
            console.log(`DEBUG: aiController - Converted Excel to CSV string for AI.`);
        }
        else {
            emitProgress(userId, 0, 'Unsupported file type for AI analysis.', `Unsupported file type: ${recentFile.fileMimeType}. Please upload a CSV or Excel file.`);
            return res.status(400).json({ message: `Unsupported file type: ${recentFile.fileMimeType}` });
        }

        emitProgress(userId, 30, `Preparing data from "${recentFile.filename}" for AI.`);

        const prompt = `Analyze the following data from an Excel/CSV file. Provide a concise summary of key insights, trends, and any notable observations. If it's a medicine booklet, highlight expiry dates, quantities, and suggest any immediate actions.
        
        File Name: ${recentFile.filename}
        File Content:\n${fileContent.substring(0, 5000)}... (truncated for brevity if very large)`;

        emitProgress(userId, 60, 'Sending data to Gemini AI.');

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        emitProgress(userId, 100, 'AI analysis complete.', text);
        res.status(200).json({ message: 'AI analysis complete.', insights: text });

    } catch (error) {
        console.error('User ' + userId + ': Error during AI analysis:', error);
        emitProgress(userId, 0, `Error during AI analysis: ${error.message}`, `Failed to get insights: ${error.message}`);
        res.status(500).json({ message: 'Error during AI analysis.', error: error.message });
    }
};
