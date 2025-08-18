// excel-analytics-backend/controllers/fileController.js
const XLSX = require('xlsx');
const File = require('../models/File');
const path = require('path');
const fs = require('fs/promises');

let io;
exports.setSocketIO = (socketIOInstance) => {
    io = socketIOInstance;
};

exports.uploadFile = async (req, res) => {
    if (!io) {
        console.error('Socket.IO instance not set in fileController.');
        return res.status(500).json({ message: 'Server configuration error: Socket.IO not initialized.' });
    }

    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    const userId = req.user.id;
    console.log(`DEBUG: fileController.uploadFile - Operating with userId: ${userId}`);
    const uploadDir = path.join(__dirname, '../uploads', userId.toString());
    const filePath = path.join(uploadDir, req.file.originalname);

    try {
        io.to(userId.toString()).emit('file_processing_progress', { progress: 5, message: 'Starting file upload...' });
        console.log(`User ${userId}: Starting file upload for ${req.file.originalname}`);

        await fs.mkdir(uploadDir, { recursive: true });
        io.to(userId.toString()).emit('file_processing_progress', { progress: 15, message: 'Upload directory ensured.' });

        await fs.writeFile(filePath, req.file.buffer);
        io.to(userId.toString()).emit('file_processing_progress', { progress: 40, message: 'File saved to server.' });
        console.log(`User ${userId}: File saved to ${filePath}`);

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        io.to(userId.toString()).emit('file_processing_progress', { progress: 60, message: 'Parsing Excel data...' });
        console.log(`User ${userId}: Parsing Excel data...`);

        const sheetName = workbook.SheetNames[0];
        const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        io.to(userId.toString()).emit('file_processing_progress', { progress: 80, message: 'Excel data parsed.' });

        // Save file metadata to MongoDB
        const existingFile = await File.findOneAndUpdate(
            { uploadedBy: userId, filename: req.file.originalname },
            {
                filename: req.file.originalname,
                filepath: filePath,
                fileMimeType: req.file.mimetype, // NEW: Save the MIME type
                data: jsonData,
                uploadedBy: userId,
                uploadDate: new Date()
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        io.to(userId.toString()).emit('file_processing_progress', { progress: 95, message: 'File metadata saved to database.' });
        console.log(`User ${userId}: File metadata saved to DB. File ID: ${existingFile._id}`);

        io.to(userId.toString()).emit('file_processing_progress', { progress: 100, message: 'File uploaded and processed successfully!' });
        console.log(`User ${userId}: File upload and processing complete.`);

        res.status(200).json({
            message: 'File uploaded and processed successfully!',
            fileId: existingFile._id,
            filename: existingFile.filename,
        });

    } catch (error) {
        console.error(`User ${userId}: Error processing file ${req.file.originalname}:`, error);
        io.to(userId.toString()).emit('processing_error', {
            message: `Error processing file: ${error.message}`,
            details: error.message
        });
        res.status(500).json({ message: 'Error processing file', error: error.message });
    }
};

// ... (rest of fileController.js remains the same)
exports.getMostRecentFile = async (userId) => {
    console.log(`DEBUG: fileController.getMostRecentFile - Querying for userId: ${userId}`);
    try {
        const file = await File.findOne({ uploadedBy: userId }).sort({ uploadDate: -1 });
        if (!file) {
            console.log(`DEBUG: fileController.getMostRecentFile - No file found for userId: ${userId}`);
            return null;
        }
        console.log(`DEBUG: fileController.getMostRecentFile - Found file for userId: ${userId}, filename: ${file.filename}, fileMimeType: ${file.fileMimeType}, fileId: ${file._id}`); // ADDED fileMimeType to log
        return file;
    } catch (error) {
        console.error(`Error fetching most recent file for user ${userId}:`, error);
        return null;
    }
};

// ... (rest of the functions like getFiles, deleteFile)
exports.getFiles = async (req, res) => {
    try {
        const userId = req.user.id;
        const files = await File.find({ uploadedBy: userId }).sort({ uploadDate: -1 });
        res.status(200).json({ files });
    } catch (error) {
        console.error(`Error fetching files for user ${userId}:`, error);
        res.status(500).json({ message: 'Error fetching files', error: error.message });
    }
};

exports.deleteFile = async (req, res) => {
    try {
        const userId = req.user.id;
        const fileId = req.params.id;

        const file = await File.findOne({ _id: fileId, uploadedBy: userId });

        if (!file) {
            return res.status(404).json({ message: 'File not found or not authorized to delete.' });
        }

        if (file.filepath && (await fs.stat(file.filepath).catch(() => null))) {
            await fs.unlink(file.filepath);
            console.log(`Deleted file from filesystem: ${file.filepath}`);
        }

        await File.deleteOne({ _id: fileId });

        res.status(200).json({ message: 'File deleted successfully.' });
    } catch (error) {
        console.error(`Error deleting file: ${error.message}`);
        res.status(500).json({ message: 'Error deleting file', error: error.message });
    }
};
