// excel-analytics-backend/socket.js
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken'); // Import jsonwebtoken for token verification
const dotenv = require('dotenv'); // To access JWT_SECRET

dotenv.config(); // Load environment variables

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*", // Allow all origins for development. In production, specify your frontend URL.
            methods: ["GET", "POST"],
            credentials: true // Important for sending cookies/auth headers
        }
    });

    // Socket.IO middleware for authentication
    io.use((socket, next) => {
        const token = socket.handshake.auth.token; // Get token from handshake
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token
                socket.userId = decoded.id; // Attach userId to the socket object
                console.log(`🔗 Socket authenticated for user: ${socket.userId}`);
                next(); // Continue connection
            } catch (err) {
                console.error('Socket authentication error: Invalid token', err.message);
                return next(new Error('Authentication error: Invalid token'));
            }
        } else {
            console.warn('Socket connection attempt without token. Allowing unauthenticated connection for now.');
            // For production, you might want to disallow unauthenticated connections:
            // return next(new Error('Authentication error: Token missing'));
            next(); // Allow connection but without user ID
        }
    });

    io.on("connection", (socket) => {
        console.log(`🔗 User connected: ${socket.id}`);

        // If authenticated, make the socket join a user-specific room
        if (socket.userId) {
            socket.join(socket.userId);
            console.log(`Socket ${socket.id} joined room for user ${socket.userId}`);
        }

        // Remove these client-side listeners. Backend controllers will emit directly.
        // socket.on("file-upload-progress", (progress) => {
        //     io.emit("update-progress", progress);
        // });
        // socket.on("chart-update", (chartData) => {
        //     io.emit("new-chart-data", chartData);
        // });

        socket.on("disconnect", () => {
            if (socket.userId) {
                console.log(`❌ User ${socket.userId} disconnected: ${socket.id}`);
            } else {
                console.log(`❌ Unauthenticated user disconnected: ${socket.id}`);
            }
        });
    });

    return io;
};

module.exports = initializeSocket;
