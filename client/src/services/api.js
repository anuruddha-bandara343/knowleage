import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Document API (IUpload & ISearch interfaces)
export const documentAPI = {
    // Upload document (with duplicate detection & compliance check)
    upload: (data) => api.post('/documents/upload', data),

    // Upload with file (multipart/form-data)
    uploadWithFile: (formData) => api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),

    // Get all documents (role-based visibility)
    getAll: (userId) => api.get(`/documents?userId=${userId}`),

    // Get single document
    getById: (id) => api.get(`/documents/${id}`),

    // Search documents
    search: (params) => api.get('/documents/search', { params }),

    // Get suggestions
    getSuggestions: (query, userId) => api.get('/documents/suggestions', { params: { query, userId } }),

    // Get stats
    getStats: (userId) => api.get('/documents/stats', { params: { userId } }),

    // Get pending (for reviewers)
    getPending: (userId) => api.get('/documents/pending', { params: { userId } }),

    // Get document history
    // Get document history
    getHistory: (id, userId) => api.get(`/documents/${id}/history`, { params: { userId } }),

    // Get AI recommendations
    getRecommendations: (userId) => api.get('/documents/recommendations', { params: { userId } }),

    // Rate document
    rate: (docId, userId, rating) => api.post(`/documents/${docId}/rate`, { userId, rating }),

    // Comments
    addComment: (docId, userId, text) => api.post(`/documents/${docId}/comments`, { userId, text }),
    deleteComment: (docId, commentId) => api.delete(`/documents/${docId}/comments/${commentId}`),

    // Likes
    toggleLike: (docId, userId) => api.post(`/documents/${docId}/like`, { userId })
};

// Review API (IReview interface)
export const reviewAPI = {
    // Update status (Approve/Reject)
    updateStatus: (id, userId, status, rejectionReason = '') =>
        api.put(`/documents/${id}/status`, { userId, status, rejectionReason }),

    // Approve document
    approve: (id, userId) => api.put(`/documents/${id}/status`, { userId, status: 'Approved' }),

    // Reject document
    reject: (id, userId, reason) => api.put(`/documents/${id}/status`, { userId, status: 'Rejected', rejectionReason: reason })
};

// Auth API (IAuth interface)
export const authAPI = {
    // Register user
    register: (data) => api.post('/auth/register', data),

    // Login user
    login: (email, password) => api.post('/auth/login', { email, password }),

    // Get leaderboard
    getLeaderboard: (limit = 10) => api.get('/auth/leaderboard', { params: { limit } }),
    getLeaderboard: (limit) => api.get(`/auth/leaderboard?limit=${limit}`),

    // Get current user
    getCurrentUser: (userId) => api.get(`/auth/me/${userId}`),

    // Notifications
    getNotifications: (userId) => api.get(`/auth/notifications/${userId}`),

    // Mark notification as read
    markNotificationRead: (notificationId) =>
        api.put(`/auth/notifications/${notificationId}/read`),

    // Upload profile image
    uploadProfileImage: (formData) => api.post('/auth/profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),

    // IT Infrastructure
    getAllUsers: (search) => api.get('/auth/users', { params: { search } }),
    updateUserRole: (userId, role) => api.put(`/auth/users/${userId}/role`, { role }),
    deleteUser: (userId) => api.delete(`/auth/users/${userId}`),
    toggleUserStatus: (userId, isActive) => api.put(`/auth/users/${userId}/status`, { isActive }),
    resetUserPassword: (userId, newPassword) => api.put(`/auth/users/${userId}/reset-password`, { newPassword }),
    getSystemStats: () => api.get('/auth/system/stats'),
    getSystemReports: () => api.get('/auth/system/reports')
};

// Governance API (Knowledge Governance Council)
export const governanceAPI = {
    // Metadata Rules
    getRules: (userId) => api.get('/governance/rules', { params: { userId } }),
    createRule: (data) => api.post('/governance/rules', data),
    updateRule: (id, data) => api.put(`/governance/rules/${id}`, data),
    deleteRule: (id, userId) => api.delete(`/governance/rules/${id}`, { params: { userId } }),

    // Audit Logs
    getAuditLogs: (params) => api.get('/governance/audit', { params }),

    // Flagged Content
    getFlaggedDocuments: (userId) => api.get('/governance/flagged', { params: { userId } }),
    toggleFlag: (docId, data) => api.put(`/governance/flag/${docId}`, data)
};

// Onboarding API (NewHire role)
export const onboardingAPI = {
    getModules: (userId) => api.get('/onboarding/modules', { params: { userId } }),
    updateProgress: (data) => api.put('/onboarding/progress', data),
    getRecommendations: (userId) => api.get('/onboarding/recommendations', { params: { userId } })
};

// Project Manager API
export const pmAPI = {
    getTeamOverview: () => api.get('/pm/team'),
    getUsageReports: () => api.get('/pm/reports'),
    getKnowledgeAssets: () => api.get('/pm/assets')
};

// Knowledge Champion API
export const kcAPI = {
    getTeamMembers: () => api.get('/kc/team'),
    getTrainingResources: () => api.get('/kc/training'),
    getEngagementMetrics: () => api.get('/kc/engagement')
};

// Senior Consultant API
export const scAPI = {
    getPendingReviews: () => api.get('/sc/pending'),
    getRepositoryCuration: () => api.get('/sc/repository'),
    getUsageMonitoring: () => api.get('/sc/usage')
};

// Consultant API
export const consultantAPI = {
    getMyUploads: (userId) => api.get('/consultant/my-uploads', { params: { userId } }),
    getRecommendations: (userId) => api.get('/consultant/recommendations', { params: { userId } }),
    getMyActivity: (userId) => api.get('/consultant/activity', { params: { userId } })
};

// Legacy API support
export const contentAPI = documentAPI;

export default api;
