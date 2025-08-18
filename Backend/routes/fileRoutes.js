const express = require('express');
const multer = require('multer');
const { uploadFile } = require('../controllers/fileController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', authMiddleware, upload.single('file'), uploadFile);

module.exports = router;
