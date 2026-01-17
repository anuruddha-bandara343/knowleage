import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth.api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load user from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('dkn_user');
        if (storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);
                setUser(parsedUser);
                // Refresh user data from server
                refreshUser(parsedUser._id || parsedUser.id);
            } catch (e) {
                localStorage.removeItem('dkn_user');
            }
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            setError(null);
            const response = await authAPI.login(email, password);
            if (response.data.success) {
                const userData = response.data.data.user;
                setUser(userData);
                localStorage.setItem('dkn_user', JSON.stringify(userData));
                return { success: true, user: userData };
            }
            return { success: false, message: response.data.message };
        } catch (err) {
            const message = err.response?.data?.message || 'Login failed';
            setError(message);
            return { success: false, message };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('dkn_user');
        localStorage.removeItem('dkn_active_tab');
    };

    const refreshUser = async (userId) => {
        const id = userId || user?._id || user?.id;
        if (!id) return;

        try {
            const response = await authAPI.getCurrentUser(id);
            if (response.data.success) {
                const updatedUser = response.data.data;
                setUser(updatedUser);
                localStorage.setItem('dkn_user', JSON.stringify(updatedUser));
            }
        } catch (err) {
            console.error('Failed to refresh user:', err);
        }
    };

    const value = {
        user,
        loading,
        error,
        isAuthenticated: !!user,
        login,
        logout,
        refreshUser,
        setUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
