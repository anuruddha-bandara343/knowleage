import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Leaderboard API
export const leaderboardAPI = {
    // Get leaderboard
    getLeaderboard: (limit = 10) =>
        api.get(`/auth/leaderboard?limit=${limit}`),

    // Get user rank
    getUserRank: (userId) =>
        api.get(`/auth/rank/${userId}`),

    // Get score breakdown
    getScoreBreakdown: (userId) =>
        api.get(`/auth/score/${userId}`)
};

export default api;
