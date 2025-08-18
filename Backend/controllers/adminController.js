// excel-analytics-backend/controllers/adminController.js
const User = require('../models/User');
const File = require('../models/File');
const fs = require('fs/promises'); // Import fs.promises for async file operations

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
    try {
        // Find all users, but exclude sensitive information like passwords
        const users = await User.find().select('-password');
        res.status(200).json({ users });
    } catch (error) {
        console.error('Error fetching all users:', error);
        res.status(500).json({ message: 'Server error while fetching users.' });
    }
};

// Get all uploaded files (Admin only)
exports.getAllFiles = async (req, res) => {
    try {
        // Find all files and populate the 'uploadedBy' field with user email
        // This allows displaying the uploader's email in the admin dashboard
        const files = await File.find().populate('uploadedBy', 'email');
        res.status(200).json({ files });
    } catch (error) {
        console.error('Error fetching all files:', error);
        res.status(500).json({ message: 'Server error while fetching files.' });
    }
};

// NEW: Delete a user and their associated files (Admin only)
exports.deleteUser = async (req, res) => {
    const userIdToDelete = req.params.id;
    const adminId = req.user.id; // ID of the admin performing the deletion

    try {
        // 1. Prevent an admin from deleting themselves
        if (userIdToDelete === adminId) {
            return res.status(400).json({ message: 'Admins cannot delete their own account from the dashboard.' });
        }

        // 2. Find the user to be deleted
        const userToDelete = await User.findById(userIdToDelete);
        if (!userToDelete) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // 3. Find and delete all files uploaded by this user
        const userFiles = await File.find({ uploadedBy: userIdToDelete });

        for (const file of userFiles) {
            // Delete file from file system
            if (file.filepath) {
                try {
                    await fs.unlink(file.filepath);
                    console.log(`Deleted file from filesystem: ${file.filepath}`);
                } catch (fsError) {
                    // Log error but continue if file doesn't exist on disk (e.g., already deleted)
                    if (fsError.code === 'ENOENT') {
                        console.warn(`File not found on disk, skipping deletion: ${file.filepath}`);
                    } else {
                        console.error(`Error deleting file from filesystem ${file.filepath}:`, fsError);
                    }
                }
            }
            // Delete file record from database
            await File.deleteOne({ _id: file._id });
        }
        console.log(`Deleted ${userFiles.length} files for user ${userIdToDelete}`);

        // 4. Delete the user from the database
        await User.deleteOne({ _id: userIdToDelete });
        console.log(`User ${userToDelete.email} (${userIdToDelete}) deleted successfully.`);

        res.status(200).json({ message: 'User and all associated files deleted successfully.' });

    } catch (error) {
        console.error(`Error deleting user ${userIdToDelete}:`, error);
        res.status(500).json({ message: 'Server error while deleting user.', error: error.message });
    }
};
