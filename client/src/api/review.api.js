import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Review API
export const reviewAPI = {
    // Update status
    updateStatus: (id, userId, status, rejectionReason = '') =>
        api.put(`/documents/${id}/status`, { userId, status, rejectionReason }),

    // Approve document
    approve: (id, userId) =>
        api.put(`/documents/${id}/status`, { userId, status: 'Approved' }),

    // Reject document
    reject: (id, userId, reason) =>
        api.put(`/documents/${id}/status`, { userId, status: 'Rejected', rejectionReason: reason }),

    // Request revision
    requestRevision: (id, userId, notes) =>
        api.put(`/documents/${id}/status`, { userId, status: 'Draft', revisionNotes: notes }),

    // Get pending reviews
    getPending: (userId) => api.get('/documents/pending', { params: { userId } }),

    // Get review history
    getHistory: (docId) => api.get(`/documents/${docId}/reviews`)
};

export default api;
