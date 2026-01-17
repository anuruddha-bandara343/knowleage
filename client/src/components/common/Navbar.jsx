import { useState, useRef, useEffect } from 'react';
import { getRoleLabel, getRoleColor } from '../../utils/roleUtils';
import { SERVER_URL } from '../../services/api';

/**
 * Navbar Component - Main navigation header
 */
const Navbar = ({
    user,
    activeTab,
    onTabChange,
    onLogout,
    searchQuery,
    onSearchChange,
    notifications = [],
    onMarkNotificationRead
}) => {
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef(null);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        if (showNotifications) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showNotifications]);

    const navItems = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'upload', label: 'Upload' },
        { id: 'leaderboard', label: 'Leaderboard' },
        { id: 'profile', label: 'Profile' }
    ];

    return (
        <nav className="header fixed-top">
            <div className="header-content container">
                {/* Brand */}
                <a className="navbar-brand d-flex align-items-center gap-2" href="#">
                    <div className="logo-icon-wrapper">
                        <span className="logo-icon">🔷</span>
                    </div>
                    <div className="logo-text">
                        <span className="logo-brand">KnowledgeShare</span>
                        <span className="logo-sub">DKN SYSTEM</span>
                    </div>
                </a>

                {/* Desktop Navigation */}
                <div className="desktop-nav d-none d-lg-flex">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            className={`nav-item-modern ${activeTab === item.id ? 'active' : ''}`}
                            onClick={() => onTabChange(item.id)}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {/* Right Side */}
                <div className="header-actions d-flex align-items-center gap-4">
                    {/* Search */}
                    <div className="search-modern d-none d-lg-block">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Search resources..."
                            value={searchQuery}
                            onChange={(e) => {
                                onSearchChange(e.target.value);
                                if (activeTab !== 'dashboard') onTabChange('dashboard');
                            }}
                        />
                    </div>

                    {/* User Profile */}
                    <div className="user-profile-modern">
                        <div className="d-none d-lg-flex align-items-center gap-3">
                            <div className="user-meta text-end">
                                <div
                                    className="user-role-badge"
                                    style={{ backgroundColor: getRoleColor(user?.role) }}
                                >
                                    {getRoleLabel(user?.role)}
                                </div>
                            </div>

                            <div
                                className="avatar-wrapper"
                                onClick={() => onTabChange('profile')}
                                title="Go to Profile"
                            >
                                {user?.profileImage ? (
                                    <img src={`${SERVER_URL}${user.profileImage}`} alt={user.name} />
                                ) : (
                                    <div className="avatar-initials">
                                        {(user?.name || 'U').charAt(0)}
                                    </div>
                                )}
                                <div className="status-indicator online"></div>
                            </div>

                            {/* Notifications */}
                            <div className="notification-bell-wrapper" ref={notificationRef}>
                                <button
                                    className="btn-bell"
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    title="Notifications"
                                >
                                    🔔
                                    {unreadCount > 0 && (
                                        <span className="notification-badge">{unreadCount}</span>
                                    )}
                                </button>
                                {showNotifications && (
                                    <div className="notification-dropdown">
                                        <div className="notification-header">
                                            <strong>Notifications</strong>
                                            {unreadCount > 0 && (
                                                <span className="unread-count">{unreadCount} new</span>
                                            )}
                                        </div>
                                        <div className="notification-list">
                                            {notifications.length === 0 ? (
                                                <div className="notification-empty">No notifications yet.</div>
                                            ) : (
                                                notifications.slice(0, 10).map(n => (
                                                    <div
                                                        key={n._id}
                                                        className={`notification-item ${n.isRead ? 'read' : 'unread'}`}
                                                        onClick={() => onMarkNotificationRead(n._id)}
                                                    >
                                                        <div className="notification-icon">
                                                            {n.type === 'LIKE' ? '❤️' : n.type === 'COMMENT' ? '💬' : '📚'}
                                                        </div>
                                                        <div className="notification-content">
                                                            <div className="notification-title">{n.title}</div>
                                                            <div className="notification-message">{n.message}</div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button onClick={onLogout} className="btn-logout-modern" title="Log Out">
                                <span>⏻</span>
                                <span className="d-none d-xl-inline">Log Out</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
