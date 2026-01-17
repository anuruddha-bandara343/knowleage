import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth.api';

const UserContext = createContext(null);

export const UserProvider = ({ children, userId }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [preferences, setPreferences] = useState({
        theme: 'dark',
        notifications: true
    });

    // Fetch notifications
    useEffect(() => {
        if (userId) {
            fetchNotifications();
        }
    }, [userId]);

    const fetchNotifications = async () => {
        if (!userId) return;
        try {
            const response = await authAPI.getNotifications(userId);
            if (response.data.success) {
                setNotifications(response.data.data);
                setUnreadCount(response.data.data.filter(n => !n.isRead).length);
            }
        } catch (err) {
            console.error('Failed to fetch notifications:', err);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await authAPI.markNotificationRead(notificationId);
            setNotifications(prev => prev.map(n =>
                n._id === notificationId ? { ...n, isRead: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
        }
    };

    const markAllAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.isRead).map(n => n._id);
        for (const id of unreadIds) {
            await markAsRead(id);
        }
    };

    const updatePreferences = (newPrefs) => {
        setPreferences(prev => ({ ...prev, ...newPrefs }));
        localStorage.setItem('dkn_preferences', JSON.stringify({ ...preferences, ...newPrefs }));
    };

    const value = {
        notifications,
        unreadCount,
        preferences,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        updatePreferences
    };

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};

export default UserContext;
