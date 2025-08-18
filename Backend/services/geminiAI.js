const axios = require('axios');
require('dotenv').config();

const GEMINI_API_URL = "https://api.google.dev/gemini";
const API_KEY = process.env.GEMINI_API_KEY;

exports.askGemini = async (prompt) => {
    try {
        const response = await axios.post(GEMINI_API_URL, {
            query: prompt,
            key: API_KEY
        });
        return response.data;
    } catch (error) {
        console.error("❌ Gemini AI Error:", error.message);
        return { message: "AI request failed" };
    }
};
