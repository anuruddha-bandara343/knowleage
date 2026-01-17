import { useState, useEffect, useRef } from 'react';
import Dashboard from './components/Dashboard';
import UploadForm from './components/UploadForm';
import Leaderboard from './components/Leaderboard';
import Profile from './components/Profile';
import Login from './components/Login';
import ChatBot from './components/ChatBot';
import { authAPI } from './services/api';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState(localStorage.getItem('dkn_active_tab') || 'dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  // Fetch notifications
  const fetchNotifications = async (userId) => {
    if (!userId) return;
    try {
      const response = await authAPI.getNotifications(userId);
      if (response.data.success) {
        setNotifications(response.data.data);
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
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Helper to fetch fresh user data
  const refreshUserData = async (currentUserId) => {
    const userId = currentUserId || user?._id || user?.id;
    if (!userId) return;

    try {
      const response = await authAPI.getCurrentUser(userId);
      if (response.data.success) {
        const updatedUser = response.data.data;
        // Only update if data actually changed to avoid unnecessary re-renders (simple check)
        if (JSON.stringify(updatedUser) !== JSON.stringify(user)) {
          setUser(updatedUser);
          localStorage.setItem('dkn_user', JSON.stringify(updatedUser));
        }
      }
    } catch (err) {
      console.error('Failed to refresh user data:', err);
    }
  };

  // Initial Data Load
  useEffect(() => {
    const storedUser = localStorage.getItem('dkn_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      // Immediately fetch fresh data to get role updates/score changes
      refreshUserData(parsedUser._id || parsedUser.id);
      fetchNotifications(parsedUser._id || parsedUser.id);
    }
  }, []);

  // Sync on tab change
  useEffect(() => {
    localStorage.setItem('dkn_active_tab', activeTab);
    if (user && (activeTab === 'leaderboard' || activeTab === 'profile')) {
      refreshUserData();
    }
  }, [activeTab]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('dkn_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('dashboard');
    localStorage.removeItem('dkn_user');
    localStorage.removeItem('dkn_active_tab');
  };

  const handleUploadSuccess = async (data) => {
    // Refresh user data from database to get accurate score
    await refreshUserData();
    // Switch to dashboard to see new content
    setActiveTab('dashboard');
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      'Admin': 'var(--danger)',
      'KnowledgeChampion': '#8b5cf6',
      'SeniorConsultant': 'var(--primary)',
      'Consultant': 'var(--text-muted)'
    };
    return colors[role] || colors['Consultant'];
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app">
      {/* Bootstrap Header with Glassmorphism */}
      {/* Professional Header - Desktop & Mobile */}
      <nav className="header fixed-top">
        <div className="header-content container">
          {/* 1. Brand / Logo */}
          <a className="navbar-brand d-flex align-items-center gap-2" href="#">
            <div className="logo-icon-wrapper">
              <span className="logo-icon">🔷</span>
            </div>
            <div className="logo-text">
              <span className="logo-brand">KnowledgeShare</span>
              <span className="logo-sub">DKN SYSTEM</span>
            </div>
          </a>

          {/* 2. Desktop Navigation - Centered */}
          <div className="desktop-nav d-none d-lg-flex">
            <button
              className={`nav-item-modern ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </button>
            <button
              className={`nav-item-modern ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              Upload
            </button>
            <button
              className={`nav-item-modern ${activeTab === 'leaderboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('leaderboard')}
            >
              Leaderboard
            </button>
            <button
              className={`nav-item-modern ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
          </div>

          {/* 3. Right Side - Search & User Profile */}
          <div className="header-actions d-flex align-items-center gap-4">
            {/* Search Bar */}
            <div className="search-modern d-none d-lg-block">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (activeTab !== 'dashboard') setActiveTab('dashboard');
                }}
              />
            </div>

            {/* User Profile Section */}
            <div className="user-profile-modern">
              {/* Mobile Toggler (only visible on mobile) */}
              <button
                className="navbar-toggler d-lg-none"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#mobileMenu"
              >
                <span className="navbar-toggler-icon" style={{ filter: 'invert(1)' }}></span>
              </button>

              {/* Mobile Notification Bell (visible only on mobile) */}
              <div className="notification-bell-wrapper d-lg-none ms-2" ref={notificationRef}>
                <button
                  className="btn-bell"
                  onClick={() => setShowNotifications(!showNotifications)}
                  title="Notifications"
                >
                  🔔
                  {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                </button>
                {showNotifications && (
                  <div className="notification-dropdown">
                    <div className="notification-header">
                      <strong>Notifications</strong>
                      {unreadCount > 0 && <span className="unread-count">{unreadCount} new</span>}
                    </div>
                    <div className="notification-list">
                      {notifications.length === 0 ? (
                        <div className="notification-empty">No notifications yet.</div>
                      ) : (
                        notifications.slice(0, 10).map(n => (
                          <div
                            key={n._id}
                            className={`notification-item ${n.isRead ? 'read' : 'unread'}`}
                            onClick={() => markAsRead(n._id)}
                          >
                            <div className="notification-icon">{n.type === 'LIKE' ? '❤️' : n.type === 'COMMENT' ? '💬' : '📚'}</div>
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

              <div className="d-none d-lg-flex align-items-center gap-3">
                <div className="user-meta text-end">
                  <div className="user-role-badge">{user.role}</div>
                </div>

                <div className="avatar-wrapper" onClick={() => setActiveTab('profile')} title="Go to Profile">
                  {user.profileImage ? (
                    <img src={`http://localhost:3000${user.profileImage}`} alt={user.name} />
                  ) : (
                    <div className="avatar-initials">{(user.name || 'U').charAt(0)}</div>
                  )}
                  <div className="status-indicator online"></div>
                </div>

                {/* Notification Bell */}
                <div className="notification-bell-wrapper" ref={notificationRef}>
                  <button
                    className="btn-bell"
                    onClick={() => setShowNotifications(!showNotifications)}
                    title="Notifications"
                  >
                    🔔
                    {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                  </button>
                  {showNotifications && (
                    <div className="notification-dropdown">
                      <div className="notification-header">
                        <strong>Notifications</strong>
                        {unreadCount > 0 && <span className="unread-count">{unreadCount} new</span>}
                      </div>
                      <div className="notification-list">
                        {notifications.length === 0 ? (
                          <div className="notification-empty">No notifications yet.</div>
                        ) : (
                          notifications.slice(0, 10).map(n => (
                            <div
                              key={n._id}
                              className={`notification-item ${n.isRead ? 'read' : 'unread'}`}
                              onClick={() => markAsRead(n._id)}
                            >
                              <div className="notification-icon">{n.type === 'LIKE' ? '❤️' : n.type === 'COMMENT' ? '💬' : '📚'}</div>
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

                <button onClick={handleLogout} className="btn-logout-modern" title="Log Out">
                  <span>⏻</span>
                  <span className="d-none d-xl-inline">Log Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content (Adjusted padding for fixed header and mobile bottom nav) */}
      <main className="container section main-content">

        {/* Tab Content */}
        {activeTab === 'dashboard' && <Dashboard user={user} searchQuery={searchQuery} />}
        {activeTab === 'upload' && (
          <UploadForm
            userId={user._id || user.id}
            onUploadSuccess={handleUploadSuccess}
          />
        )}
        {activeTab === 'leaderboard' && <Leaderboard />}
        {activeTab === 'profile' && <Profile user={user} onLogout={handleLogout} onRefresh={refreshUserData} />}
      </main>

      {/* Mobile Bottom Navigation - Professional Floating Bar */}
      <nav className="mobile-bottom-nav floating-nav">
        <div className="nav-container">
          <button
            className={`mobile-nav-item modern ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <div className="icon-wrapper">
              <span className="mobile-nav-icon">🏠</span>
            </div>
            <span className="mobile-nav-label">Home</span>
          </button>

          <button
            className={`mobile-nav-item modern ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <div className="icon-wrapper">
              <span className="mobile-nav-icon">＋</span>
            </div>
            <span className="mobile-nav-label">Upload</span>
          </button>

          <button
            className={`mobile-nav-item modern ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaderboard')}
          >
            <div className="icon-wrapper">
              <span className="mobile-nav-icon">🏆</span>
            </div>
            <span className="mobile-nav-label">Ranks</span>
          </button>

          <button
            className={`mobile-nav-item modern ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <div className="icon-wrapper">
              <span className="mobile-nav-icon">👤</span>
            </div>
            <span className="mobile-nav-label">Profile</span>
          </button>
        </div>
      </nav>

      {/* AI Chatbot */}
      <ChatBot user={user} />

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <span>KnowledgeShare © {new Date().getFullYear()}</span>
          <span className="footer-divider">|</span>
          <span>Digital Knowledge Network v2.0</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
