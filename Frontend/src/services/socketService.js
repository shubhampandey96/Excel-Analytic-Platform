// excel-analytics-frontend/src/services/socketService.js
import { io } from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket;

const socketService = {
    connect: () => {
        if (!socket) {
            const token = localStorage.getItem('token'); // Get the JWT token from local storage
            socket = io(SOCKET_SERVER_URL, {
                // Pass the token in the 'auth' object
                auth: { token: token }
            });

            socket.on('connect', () => {
                console.log('Socket.IO connected');
            });

            socket.on('disconnect', () => {
                console.log('Socket.IO disconnected');
            });

            socket.on('connect_error', (err) => {
                console.error('Socket.IO connection error:', err.message);
            });
        }
    },
    disconnect: () => {
        if (socket) {
            socket.disconnect();
            socket = null;
            console.log('Socket.IO explicitly disconnected');
        }
    },
    on: (eventName, callback) => {
        if (socket) {
            socket.on(eventName, callback);
        } else {
            console.warn('Socket not connected. Cannot set up listener for:', eventName);
        }
    },
    off: (eventName, callback) => {
        if (socket) {
            socket.off(eventName, callback);
        }
    },
    emit: (eventName, data) => {
        if (socket) {
            socket.emit(eventName, data);
        } else {
            console.warn('Socket not connected. Cannot emit event:', eventName);
        }
    }
};

export default socketService;
