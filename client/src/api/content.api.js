import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Content/Document API
export const contentAPI = {
    // Upload document
    upload: (data) => api.post('/documents/upload', data),
    uploadWithFile: (formData) => api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),

    // Get documents
    getAll: (userId) => api.get(`/documents?userId=${userId}`),
    getById: (id) => api.get(`/documents/${id}`),

    // Search
    search: (params) => api.get('/documents/search', { params }),
    getSuggestions: (query, userId) => api.get('/documents/suggestions', { params: { query, userId } }),

    // Stats
    getStats: (userId) => api.get('/documents/stats', { params: { userId } }),
    getPending: (userId) => api.get('/documents/pending', { params: { userId } }),
    getHistory: (id, userId) => api.get(`/documents/${id}/history`, { params: { userId } }),
    getRecommendations: (userId) => api.get('/documents/recommendations', { params: { userId } }),

    // Interactions
    rate: (docId, userId, rating) => api.post(`/documents/${docId}/rate`, { userId, rating }),
    addComment: (docId, userId, text) => api.post(`/documents/${docId}/comments`, { userId, text }),
    deleteComment: (docId, commentId) => api.delete(`/documents/${docId}/comments/${commentId}`),
    toggleLike: (docId, userId) => api.post(`/documents/${docId}/like`, { userId })
};

// Legacy alias
export const documentAPI = contentAPI;

export default api;
