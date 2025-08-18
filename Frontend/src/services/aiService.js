// excel-analytics-frontend/src/services/aiService.js
import api from './api'; // Assuming you have an api.js for Axios instance with auth headers

const aiService = {
    getAIInsights: async () => {
        try {
            // The actual insights will come via Socket.IO, this just triggers the backend process
            // Removed the duplicated '/api' prefix
            const response = await api.post('/ai/analyze');
            return response.data; // This will likely be a success message, not the insights themselves
        } catch (error) {
            console.error('Error in aiService.getAIInsights:', error);
            throw error;
        }
    }
};

export default aiService;
