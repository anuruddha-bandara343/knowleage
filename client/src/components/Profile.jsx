import { useState, useEffect, useRef } from 'react';
import { authAPI, documentAPI, SERVER_URL } from '../services/api';

const Profile = ({ user, onLogout, onRefresh }) => {
    const [stats, setStats] = useState({ uploads: 0, approved: 0, pending: 0 });
    const [loading, setLoading] = useState(true);
    const [imageLoading, setImageLoading] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const userId = user._id || user.id;
                const response = await documentAPI.getStats(userId);
                if (response.data.success) {
                    setStats(response.data.data);
                }
            } catch (err) {
                console.error('Stats error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user]);

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert('Image must be less than 5MB');
            return;
        }

        try {
            setImageLoading(true);
            const formData = new FormData();
            formData.append('image', file);
            formData.append('userId', user._id || user.id);

            const response = await authAPI.uploadProfileImage(formData);

            if (response.data.success) {
                // Refresh global user data
                if (onRefresh) {
                    await onRefresh();
                }
            }
        } catch (error) {
            console.error('Image upload failed:', error);
            alert('Failed to update profile image');
        } finally {
            setImageLoading(false);
        }
    };

    const getRoleColor = (role) => {
        const colors = {
            'Admin': '#ef4444',
            'KnowledgeChampion': '#8b5cf6',
            'SeniorConsultant': '#3b82f6',
            'Consultant': '#64748b'
        };
        return colors[role] || colors['Consultant'];
    };

    const getRoleDescription = (role) => {
        const descriptions = {
            'Admin': 'System Administrator with full access',
            'KnowledgeChampion': 'Top contributor and content reviewer',
            'SeniorConsultant': 'Experienced consultant with review privileges',
            'Consultant': 'Knowledge contributor'
        };
        return descriptions[role] || descriptions['Consultant'];
    };

    const getUserInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const API_URL = SERVER_URL;

    // Helper to get full image URL (handles both relative and absolute)
    const getProfileImageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `${API_URL}${path}`;
    };

    return (
        <div className="profile-container">
            {/* Profile Header */}
            <div className="profile-header">
                <div
                    className="profile-avatar-large"
                    onClick={handleImageClick}
                    style={{ cursor: 'pointer', position: 'relative' }}
                >
                    {imageLoading ? (
                        <div className="spinner-border text-light" role="status"></div>
                    ) : user.profileImage ? (
                        <img
                            src={getProfileImageUrl(user.profileImage)}
                            alt={user.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                        />
                    ) : (
                        getUserInitials(user.name)
                    )}

                    {/* Camera Overlay */}
                    <div className="avatar-overlay">
                        <span className="camera-icon">📷</span>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                    />
                </div>
                <h1 className="profile-name">{user.name}</h1>
                <p className="profile-email">{user.email}</p>
                <div
                    className="profile-role-badge"
                    style={{ background: getRoleColor(user.role) }}
                >
                    {user.role}
                </div>
                <p className="profile-role-desc">{getRoleDescription(user.role)}</p>
            </div>

            {/* Score Card */}
            <div className="profile-score-card">
                <div className="score-icon">⭐</div>
                <div className="score-info">
                    <span className="score-number">{user.score || 0}</span>
                    <span className="score-label">Contribution Points</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="profile-stats">
                <div className="stat-item">
                    <span className="stat-number">{loading ? '-' : stats.total || 0}</span>
                    <span className="stat-label">Uploads</span>
                </div>
                <div className="stat-item">
                    <span className="stat-number">{loading ? '-' : stats.approved || 0}</span>
                    <span className="stat-label">Approved</span>
                </div>
                <div className="stat-item">
                    <span className="stat-number">{loading ? '-' : stats.pending || 0}</span>
                    <span className="stat-label">Pending</span>
                </div>
            </div>

            {/* Badges Section */}
            {user.badges?.length > 0 && (
                <div className="profile-section">
                    <h3 className="section-title">🏆 Badges Earned</h3>
                    <div className="badges-grid">
                        {user.badges.map((badge, index) => (
                            <div key={index} className="badge-card">
                                <span className="badge-icon-large">{badge.icon || '🏆'}</span>
                                <span className="badge-name">{badge.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Account Info */}
            <div className="profile-section">
                <h3 className="section-title">📋 Account Information</h3>
                <div className="info-list">
                    <div className="info-item">
                        <span className="info-label">Email</span>
                        <span className="info-value">{user.email}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Role</span>
                        <span className="info-value">{user.role}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Member Since</span>
                        <span className="info-value">
                            {user.createdAt
                                ? new Date(user.createdAt).toLocaleDateString()
                                : 'N/A'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Logout Button */}
            <button className="btn-logout" onClick={onLogout}>
                🚪 Sign Out
            </button>

            {/* Mobile Bottom Nav Spacer */}
            <div className="d-md-none" style={{ height: '100px' }}></div>
        </div>
    );
};

export default Profile;
