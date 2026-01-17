import { useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/auth.api';

/**
 * Custom hook for authentication
 */
export const useAuth = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Initialize from localStorage
    useEffect(() => {
        const storedUser = localStorage.getItem('dkn_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                localStorage.removeItem('dkn_user');
            }
        }
        setLoading(false);
    }, []);

    const login = useCallback(async (email, password) => {
        try {
            setLoading(true);
            setError(null);

            const response = await authAPI.login(email, password);

            if (response.data.success) {
                const userData = response.data.data.user;
                setUser(userData);
                localStorage.setItem('dkn_user', JSON.stringify(userData));
                return { success: true, user: userData };
            }

            throw new Error(response.data.message || 'Login failed');
        } catch (err) {
            const message = err.response?.data?.message || err.message || 'Login failed';
            setError(message);
            return { success: false, message };
        } finally {
            setLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        setError(null);
        localStorage.removeItem('dkn_user');
        localStorage.removeItem('dkn_active_tab');
    }, []);

    const refreshUser = useCallback(async () => {
        const userId = user?._id || user?.id;
        if (!userId) return;

        try {
            const response = await authAPI.getCurrentUser(userId);
            if (response.data.success) {
                const updatedUser = response.data.data;
                setUser(updatedUser);
                localStorage.setItem('dkn_user', JSON.stringify(updatedUser));
            }
        } catch (err) {
            console.error('Failed to refresh user:', err);
        }
    }, [user]);

    const hasRole = useCallback((roles) => {
        if (!user) return false;
        const roleArray = Array.isArray(roles) ? roles : [roles];
        return roleArray.includes(user.role);
    }, [user]);

    const isAdmin = useCallback(() => {
        return hasRole(['ITInfrastructure', 'Admin']);
    }, [hasRole]);

    const canReview = useCallback(() => {
        return hasRole(['SeniorConsultant', 'ProjectManager', 'KnowledgeChampion', 'KnowledgeGovernanceCouncil', 'ITInfrastructure']);
    }, [hasRole]);

    return {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
        hasRole,
        isAdmin,
        canReview
    };
};

export default useAuth;
