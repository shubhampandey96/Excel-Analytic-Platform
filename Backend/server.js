// excel-analytics-backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const multer = require('multer'); // For file uploads
const initializeSocket = require('./socket'); // For Socket.IO setup
const connectDB = require("./config/database.js"); // For MongoDB connection

// Import your route modules
const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes'); // This is not used globally, but kept for reference
const historyRoutes = require('./routes/historyRoutes');
const adminRoutes = require('./routes/adminRoutes'); // Make sure this is imported if you're using it

// Import your middleware
const authMiddleware = require('./middleware/authMiddleware');
const historyLoggerMiddleware = require('./middleware/historyLogger');

// Import controllers
const fileController = require('./controllers/fileController');
const aiController = require('./controllers/aiController');

dotenv.config();

const app = express();

// Middleware setup
app.use(cors());

// NEW: Global Request Logger (keep this for general debugging)
app.use((req, res, next) => {
    console.log(`Incoming Request: ${req.method} ${req.originalUrl}`);
    next();
});

// IMPORTANT: connectDB() must be called BEFORE the server starts listening for requests.
connectDB();

// Create HTTP server and initialize Socket.IO
const server = http.createServer(app);
const io = initializeSocket(server);

// Pass Socket.IO instance to controllers
fileController.setSocketIO(io);
aiController.setSocketIO(io);

// --- API Routes ---

// Test API Route (public)
app.get('/api/test', (req, res) => {
    res.status(200).json({ message: 'API is working properly!' });
});

// Authentication Routes - Apply express.json() ONLY to this route group
app.use('/api/auth', express.json(), authRoutes);

// File Upload API with Authentication
const upload = multer({ storage: multer.memoryStorage() });

// This route handles multipart/form-data and does NOT need express.json()
// Multer must be BEFORE any other body parsers for this route.
app.post('/api/files/upload', 
    authMiddleware, 
    upload.single('file'), 
    fileController.uploadFile
);

// History Routes - Apply express.json() ONLY to this route group
app.use('/api/history', express.json(), authMiddleware, historyLoggerMiddleware, historyRoutes);

// AI Integration Route - Apply express.json() ONLY to this route
app.post('/api/ai/analyze', express.json(), authMiddleware, aiController.analyzeData);

// Admin Routes - Apply express.json() ONLY to this route group
app.use('/api/admin', express.json(), adminRoutes);

// --- Error Handling ---
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// --- Server Start ---
mongoose.connection.once('open', () => console.log('✅ MongoDB Connected Successfully'));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
