import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Search API
export const searchAPI = {
    // Full text search
    search: (query, filters = {}) =>
        api.get('/documents/search', { params: { query, ...filters } }),

    // Get suggestions for autocomplete
    getSuggestions: (query, userId) =>
        api.get('/documents/suggestions', { params: { query, userId } }),

    // Get popular tags
    getPopularTags: (limit = 10) =>
        api.get('/documents/tags/popular', { params: { limit } }),

    // Advanced search
    advancedSearch: (params) =>
        api.post('/documents/search/advanced', params)
};

export default api;
