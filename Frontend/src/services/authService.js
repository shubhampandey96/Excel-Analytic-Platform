// excel-analytics-frontend/src/services/authService.js
import api from './api';

const authService = {
    register: async (userData) => {
        try {
            // Removed the duplicated '/api' prefix
            const response = await api.post('/auth/register', userData);
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || 'Registration failed';
        }
    },

    login: async (credentials) => {
        try {
            // Removed the duplicated '/api' prefix
            const response = await api.post('/auth/login', credentials);
            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
            }
            return response.data;
        } catch (error) {
            throw error.response?.data?.message || 'Login failed';
        }
    },

    logout: () => {
        localStorage.removeItem('token');
    },

    getCurrentUser: () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                // In a real app, you'd decode the token here to get user info
                // For now, just returning the token itself as a check for presence
                return token;
            } catch (error) {
                console.error('Invalid token:', error);
                localStorage.removeItem('token');
                return null;
            }
        }
        return null;
    }
};

export default authService;
