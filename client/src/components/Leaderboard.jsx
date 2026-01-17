import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const Leaderboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const response = await authAPI.getLeaderboard(15);
                setUsers(response.data.data);
            } catch (err) {
                console.error('Leaderboard error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    const getUserInitials = (name) => {
        if (!name) return '??';
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getRankClass = (rank) => {
        if (rank === 1) return 'gold';
        if (rank === 2) return 'silver';
        if (rank === 3) return 'bronze';
        return '';
    };

    const getRankEmoji = (rank) => {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return rank;
    };

    const getRoleBadge = (role) => {
        const badges = {
            'Admin': { color: '#ef4444', label: 'Admin' },
            'KnowledgeChampion': { color: '#8b5cf6', label: 'Champion' },
            'SeniorConsultant': { color: '#3b82f6', label: 'Senior' },
            'Consultant': { color: '#6b7280', label: 'Consultant' }
        };
        return badges[role] || badges['Consultant'];
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div>
            <h1 className="page-title">🏆 Leaderboard</h1>
            <p className="page-subtitle">Top contributors by contribution score</p>

            {users.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🏆</div>
                    <h3>No rankings yet</h3>
                    <p>Start uploading content to earn points!</p>
                </div>
            ) : (
                <div className="leaderboard-container">
                    {/* Top 3 Podium */}
                    <div className="podium-section">
                        {/* Rank 2 */}
                        {users[1] && (
                            <div className="podium-card rank-2">
                                <div className="podium-avatar-container">
                                    <div className="podium-avatar">
                                        {getUserInitials(users[1].name)}
                                    </div>
                                    <div className="rank-badge-circle">2</div>
                                </div>
                                <div className="podium-user-info">
                                    <div className="podium-name">{users[1].name}</div>
                                    <div className="podium-score">{users[1].score}</div>
                                    <div className="podium-handle">@{users[1].role.toLowerCase()}</div>
                                </div>
                            </div>
                        )}

                        {/* Rank 1 */}
                        {users[0] && (
                            <div className="podium-card rank-1">
                                <div className="crown-icon">👑</div>
                                <div className="podium-avatar-container">
                                    <div className="podium-avatar">
                                        {getUserInitials(users[0].name)}
                                    </div>
                                    <div className="rank-badge-circle">1</div>
                                </div>
                                <div className="podium-user-info">
                                    <div className="podium-name">{users[0].name}</div>
                                    <div className="podium-score">{users[0].score}</div>
                                    <div className="podium-handle">@{users[0].role.toLowerCase()}</div>
                                </div>
                            </div>
                        )}

                        {/* Rank 3 */}
                        {users[2] && (
                            <div className="podium-card rank-3">
                                <div className="podium-avatar-container">
                                    <div className="podium-avatar">
                                        {getUserInitials(users[2].name)}
                                    </div>
                                    <div className="rank-badge-circle">3</div>
                                </div>
                                <div className="podium-user-info">
                                    <div className="podium-name">{users[2].name}</div>
                                    <div className="podium-score">{users[2].score}</div>
                                    <div className="podium-handle">@{users[2].role.toLowerCase()}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Rankings List (4th onwards) */}
                    <div className="leaderboard-list">
                        {users.slice(3).map((user) => (
                            <div key={user.id} className="list-row">
                                <div className="list-rank">{user.rank}</div>
                                <div className="list-avatar">
                                    {getUserInitials(user.name)}
                                </div>
                                <div className="list-main">
                                    <div className="list-name">{user.name}</div>
                                    <div className="list-role">{user.role}</div>
                                </div>
                                <div className="list-score">{user.score}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Leaderboard;
