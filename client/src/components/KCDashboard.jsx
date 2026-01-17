import { useState, useEffect } from 'react';
import { kcAPI } from '../services/api';
import Feed from './Feed';

const KCDashboard = ({ user }) => {
    const [activeTab, setActiveTab] = useState('global-feed');
    const [teamData, setTeamData] = useState(null);
    const [training, setTraining] = useState(null);
    const [engagement, setEngagement] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'team') fetchTeam();
        if (activeTab === 'training') fetchTraining();
        if (activeTab === 'engagement') fetchEngagement();
    }, [activeTab]);

    const fetchTeam = async () => {
        setLoading(true);
        try {
            const res = await kcAPI.getTeamMembers();
            setTeamData(res.data.data);
        } catch (err) {
            console.error('Failed to fetch team', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchTraining = async () => {
        setLoading(true);
        try {
            const res = await kcAPI.getTrainingResources();
            setTraining(res.data.data);
        } catch (err) {
            console.error('Failed to fetch training', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchEngagement = async () => {
        setLoading(true);
        try {
            const res = await kcAPI.getEngagementMetrics();
            setEngagement(res.data.data);
        } catch (err) {
            console.error('Failed to fetch engagement', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="kc-dashboard container mt-4">
            <h2 className="mb-4 text-white">🏆 Knowledge Champion Dashboard</h2>

            {/* Navigation Tabs */}
            <div className="nav nav-pills mb-4 gap-2">
                {['global-feed', 'team', 'training', 'engagement'].map(tab => (
                    <button
                        key={tab}
                        className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-dark'}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'global-feed' && '🌍 Global Feed'}
                        {tab === 'team' && '👥 Team Onboarding'}
                        {tab === 'training' && '📚 Training Resources'}
                        {tab === 'engagement' && '📊 Engagement'}
                    </button>
                ))}
            </div>

            <div className="dashboard-content card p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
                {loading && <div className="text-center py-5"><div className="spinner"></div></div>}

                {/* GLOBAL FEED */}
                {activeTab === 'global-feed' && <Feed user={user} />}

                {/* TEAM ONBOARDING */}
                {!loading && activeTab === 'team' && teamData && (
                    <div className="team-onboarding">
                        {/* Stats */}
                        <div className="row g-4 mb-4">
                            <div className="col-md-3">
                                <div className="stat-card p-4 text-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 'var(--radius-lg)' }}>
                                    <div className="h2 text-white mb-0">{teamData.stats.totalActive}</div>
                                    <div className="small text-white-50">Total Active</div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="stat-card p-4 text-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: 'var(--radius-lg)' }}>
                                    <div className="h2 text-white mb-0">{teamData.stats.newHireCount}</div>
                                    <div className="small text-white-50">New Hires</div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="stat-card p-4 text-center" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: 'var(--radius-lg)' }}>
                                    <div className="h2 text-white mb-0">{teamData.stats.fullyOnboarded}</div>
                                    <div className="small text-white-50">Fully Onboarded</div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="stat-card p-4 text-center" style={{ background: 'linear-gradient(135deg, #ec4899, #be185d)', borderRadius: 'var(--radius-lg)' }}>
                                    <div className="h2 text-white mb-0">{teamData.stats.onboardingRate}%</div>
                                    <div className="small text-white-50">Onboarding Rate</div>
                                </div>
                            </div>
                        </div>

                        {/* New Hires to Focus On */}
                        <h5 className="text-white mb-3">🆕 New Hires & In-Progress Onboarding</h5>
                        <div className="table-responsive">
                            <table className="table table-dark table-hover align-middle">
                                <thead>
                                    <tr><th>Name</th><th>Role</th><th>Progress</th><th>Joined</th></tr>
                                </thead>
                                <tbody>
                                    {teamData.newHires.slice(0, 10).map(member => (
                                        <tr key={member._id}>
                                            <td>
                                                <div className="fw-semibold">{member.name}</div>
                                                <div className="small" style={{ color: '#94a3b8' }}>{member.email}</div>
                                            </td>
                                            <td><span className="badge bg-info">{member.role}</span></td>
                                            <td>
                                                <div className="progress" style={{ height: '8px', width: '100px', background: 'var(--bg-highlight)' }}>
                                                    <div className="progress-bar bg-success" style={{ width: `${member.onboardingProgress || 0}%` }}></div>
                                                </div>
                                                <span className="small" style={{ color: '#94a3b8' }}>{member.onboardingProgress || 0}%</span>
                                            </td>
                                            <td className="small" style={{ color: '#94a3b8' }}>{new Date(member.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TRAINING RESOURCES */}
                {!loading && activeTab === 'training' && training && (
                    <div className="training-resources">
                        <div className="row g-4">
                            <div className="col-lg-8">
                                <h5 className="text-white mb-3">📖 Training Documents ({training.totalTrainingResources})</h5>
                                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                    {training.trainingDocs.map(doc => (
                                        <div key={doc._id} className="card bg-dark mb-2 p-3" style={{ borderRadius: 'var(--radius-md)' }}>
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div>
                                                    <div className="text-white fw-semibold">{doc.title}</div>
                                                    <div className="small" style={{ color: '#94a3b8' }}>{doc.description?.substring(0, 80)}...</div>
                                                    <div className="mt-1">
                                                        {doc.tags?.slice(0, 3).map(tag => (
                                                            <span key={tag} className="badge bg-secondary me-1">{tag}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="text-end">
                                                    {doc.averageRating > 0 && <span className="text-warning">⭐ {doc.averageRating.toFixed(1)}</span>}
                                                    <div className="small" style={{ color: '#94a3b8' }}>by {doc.uploader?.name}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="col-lg-4">
                                <h5 className="text-white mb-3">🏅 Top Contributors</h5>
                                <div className="p-3" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
                                    {training.topContributors.map((c, idx) => (
                                        <div key={idx} className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary">
                                            <span className="text-white">{idx + 1}. {c.name}</span>
                                            <span className="badge bg-primary">{c.contributions} docs</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ENGAGEMENT METRICS */}
                {!loading && activeTab === 'engagement' && engagement && (
                    <div className="engagement-metrics">
                        <div className="row g-4">
                            {/* Activity by Type */}
                            <div className="col-lg-6">
                                <h5 className="text-white mb-3">📊 Activity Distribution (30 days)</h5>
                                <div className="p-3" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
                                    {engagement.activityByType.map(item => {
                                        const total = engagement.activityByType.reduce((sum, i) => sum + i.count, 0);
                                        const percent = total > 0 ? Math.round((item.count / total) * 100) : 0;
                                        return (
                                            <div key={item._id} className="mb-3">
                                                <div className="d-flex justify-content-between small text-white mb-1">
                                                    <span>{item._id}</span>
                                                    <span>{item.count} ({percent}%)</span>
                                                </div>
                                                <div className="progress" style={{ height: '8px', background: 'var(--bg-highlight)' }}>
                                                    <div className="progress-bar" style={{ width: `${percent}%`, background: 'var(--primary)' }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Most Engaged */}
                            <div className="col-lg-6">
                                <h5 className="text-white mb-3">🔥 Most Engaged Users</h5>
                                <div className="p-3" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', maxHeight: '300px', overflowY: 'auto' }}>
                                    {engagement.engagedUsers.map((eu, idx) => (
                                        <div key={idx} className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary">
                                            <div>
                                                <div className="text-white">{eu.user?.name}</div>
                                                <div className="small" style={{ color: '#94a3b8' }}>{eu.user?.role}</div>
                                            </div>
                                            <span className="badge bg-success">{eu.actions} actions</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Badge Leaders */}
                            <div className="col-lg-6">
                                <h5 className="text-white mb-3">🏆 Badge Leaders</h5>
                                <div className="p-3" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
                                    {engagement.badgeLeaders.length === 0 ? (
                                        <p className="text-muted text-center">No badges earned yet</p>
                                    ) : (
                                        engagement.badgeLeaders.map((leader, idx) => (
                                            <div key={idx} className="d-flex justify-content-between align-items-center mb-2">
                                                <span className="text-white">{leader.name}</span>
                                                <div>
                                                    {leader.badges?.slice(0, 3).map((b, i) => (
                                                        <span key={i} className="me-1">{b.icon || '🏆'}</span>
                                                    ))}
                                                    <span className="badge bg-warning text-dark ms-2">⭐ {leader.score}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Daily Trend */}
                            <div className="col-lg-6">
                                <h5 className="text-white mb-3">📈 Daily Activity Trend</h5>
                                <div className="p-3" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
                                    <div className="d-flex align-items-end gap-1" style={{ height: '120px' }}>
                                        {engagement.dailyTrend.map((day, idx) => {
                                            const maxCount = Math.max(...engagement.dailyTrend.map(d => d.count), 1);
                                            const height = (day.count / maxCount) * 100;
                                            return (
                                                <div key={idx} className="text-center flex-fill">
                                                    <div
                                                        style={{ height: `${height}%`, minHeight: '4px', background: 'var(--primary)', borderRadius: '4px 4px 0 0' }}
                                                        title={`${day._id}: ${day.count}`}
                                                    ></div>
                                                    <div className="small" style={{ color: '#94a3b8', fontSize: '0.6rem' }}>
                                                        {day._id?.slice(-2)}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default KCDashboard;
