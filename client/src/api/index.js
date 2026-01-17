/**
 * Unified API exports
 * Re-exports all API modules for backward compatibility
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Re-export individual APIs
export { authAPI } from './auth.api';
export { contentAPI, documentAPI } from './content.api';
export { reviewAPI } from './review.api';
export { searchAPI } from './search.api';
export { leaderboardAPI } from './leaderboard.api';

// Additional APIs that were in the original api.js

// Governance API
export const governanceAPI = {
    getRules: (userId) => api.get('/governance/rules', { params: { userId } }),
    createRule: (data) => api.post('/governance/rules', data),
    updateRule: (id, data) => api.put(`/governance/rules/${id}`, data),
    deleteRule: (id, userId) => api.delete(`/governance/rules/${id}`, { params: { userId } }),
    getAuditLogs: (params) => api.get('/governance/audit', { params }),
    getFlaggedDocuments: (userId) => api.get('/governance/flagged', { params: { userId } }),
    toggleFlag: (docId, data) => api.put(`/governance/flag/${docId}`, data)
};

// Onboarding API
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

// IT/Admin API
export const adminAPI = {
    getAllUsers: (search) => api.get('/auth/users', { params: { search } }),
    updateUserRole: (userId, role) => api.put(`/auth/users/${userId}/role`, { role }),
    deleteUser: (userId) => api.delete(`/auth/users/${userId}`),
    toggleUserStatus: (userId, isActive) => api.put(`/auth/users/${userId}/status`, { isActive }),
    resetUserPassword: (userId, newPassword) => api.put(`/auth/users/${userId}/reset-password`, { newPassword }),
    getSystemStats: () => api.get('/auth/system/stats'),
    getSystemReports: () => api.get('/auth/system/reports')
};

export default api;
