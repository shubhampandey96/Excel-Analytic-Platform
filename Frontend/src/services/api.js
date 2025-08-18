// excel-analytics-frontend/src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    // Remove default Content-Type here, let Axios handle it based on data type
    // headers: {
    //     'Content-Type': 'application/json', // REMOVE THIS LINE
    // },
});

// Request interceptor to add the auth token to headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['x-auth-token'] = token; // Attach the token to the header
        }
        // If the request data is FormData, let Axios set the Content-Type header automatically
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type']; // Crucial: Remove if it was set globally
        } else {
            // Otherwise, ensure it's application/json for other requests
            config.headers['Content-Type'] = 'application/json';
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Optional: Response interceptor to handle token expiration/invalidity
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401 && !error.config.url.includes('/auth/login')) {
            console.error('Unauthorized request. Redirecting to login...');
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
