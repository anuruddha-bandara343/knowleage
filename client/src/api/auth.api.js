import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Auth API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (email, password) => api.post('/auth/login', { email, password }),
    getCurrentUser: (userId) => api.get(`/auth/me/${userId}`),
    getNotifications: (userId) => api.get(`/auth/notifications/${userId}`),
    markNotificationRead: (notificationId) => api.put(`/auth/notifications/${notificationId}/read`),
    uploadProfileImage: (formData) => api.post('/auth/profile-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    })
};

export default api;
