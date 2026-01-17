import { useState, useEffect } from 'react';
import { pmAPI } from '../services/api';
import Feed from './Feed';

const PMDashboard = ({ user }) => {
    const [activeTab, setActiveTab] = useState('global-feed');
    const [teamData, setTeamData] = useState(null);
    const [reports, setReports] = useState(null);
    const [assets, setAssets] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'team') fetchTeam();
        if (activeTab === 'reports') fetchReports();
        if (activeTab === 'assets') fetchAssets();
    }, [activeTab]);

    const fetchTeam = async () => {
        setLoading(true);
        try {
            const res = await pmAPI.getTeamOverview();
            setTeamData(res.data.data);
        } catch (err) {
            console.error('Failed to fetch team', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await pmAPI.getUsageReports();
            setReports(res.data.data);
        } catch (err) {
            console.error('Failed to fetch reports', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const res = await pmAPI.getKnowledgeAssets();
            setAssets(res.data.data);
        } catch (err) {
            console.error('Failed to fetch assets', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pm-dashboard container mt-4">
            <h2 className="mb-4 text-white">📊 Project Manager Dashboard</h2>

            {/* Navigation Tabs */}
            <div className="nav nav-pills mb-4 gap-2">
                {['global-feed', 'team', 'reports', 'assets'].map(tab => (
                    <button
                        key={tab}
                        className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-dark'}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'global-feed' && '🌍 Global Feed'}
                        {tab === 'team' && '👥 Team Overview'}
                        {tab === 'reports' && '📈 Usage Reports'}
                        {tab === 'assets' && '📚 Knowledge Assets'}
                    </button>
                ))}
            </div>

            <div className="dashboard-content card p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
                {loading && <div className="text-center py-5"><div className="spinner"></div></div>}

                {/* GLOBAL FEED */}
                {activeTab === 'global-feed' && <Feed user={user} />}

                {/* TEAM OVERVIEW */}
                {!loading && activeTab === 'team' && teamData && (
                    <div className="team-overview">
                        {/* Stats Cards */}
                        <div className="row g-4 mb-4">
                            <div className="col-md-4">
                                <div className="stat-card p-4 text-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 'var(--radius-lg)' }}>
                                    <div className="h2 text-white mb-0">{teamData.totalMembers}</div>
                                    <div className="small text-white-50">Team Members</div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="stat-card p-4 text-center" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: 'var(--radius-lg)' }}>
                                    <div className="h2 text-white mb-0">{teamData.team.reduce((sum, u) => sum + u.uploads, 0)}</div>
                                    <div className="small text-white-50">Total Uploads</div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="stat-card p-4 text-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: 'var(--radius-lg)' }}>
                                    <div className="h2 text-white mb-0">{teamData.team.reduce((sum, u) => sum + u.approved, 0)}</div>
                                    <div className="small text-white-50">Approved Docs</div>
                                </div>
                            </div>
                        </div>

                        {/* Role Breakdown */}
                        <div className="mb-4">
                            <h5 className="text-white mb-3">Role Distribution</h5>
                            <div className="d-flex flex-wrap gap-2">
                                {teamData.roleBreakdown.map(r => (
                                    <span key={r._id} className="badge bg-secondary p-2">{r._id}: <strong>{r.count}</strong></span>
                                ))}
                            </div>
                        </div>

                        {/* Team Table */}
                        <h5 className="text-white mb-3">Team Performance</h5>
                        <div className="table-responsive">
                            <table className="table table-dark table-hover align-middle">
                                <thead>
                                    <tr><th>Member</th><th>Role</th><th>Score</th><th>Uploads</th><th>Approved</th></tr>
                                </thead>
                                <tbody>
                                    {teamData.team.slice(0, 15).map(member => (
                                        <tr key={member._id}>
                                            <td>
                                                <div className="fw-semibold">{member.name}</div>
                                                <div className="small" style={{ color: '#94a3b8' }}>{member.email}</div>
                                            </td>
                                            <td><span className="badge bg-primary">{member.role}</span></td>
                                            <td><span className="text-warning">⭐ {member.score}</span></td>
                                            <td>{member.uploads}</td>
                                            <td>{member.approved}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* USAGE REPORTS */}
                {!loading && activeTab === 'reports' && reports && (
                    <div className="usage-reports">
                        <div className="row g-4">
                            {/* User Activity */}
                            <div className="col-lg-6">
                                <h5 className="text-white mb-3">🏆 Most Active Users (30 days)</h5>
                                <div className="p-3" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', maxHeight: '400px', overflowY: 'auto' }}>
                                    {reports.userActivity.map((ua, idx) => (
                                        <div key={idx} className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary">
                                            <div>
                                                <div className="text-white">{ua.user?.name || 'Unknown'}</div>
                                                <div className="small" style={{ color: '#94a3b8' }}>{ua.user?.email}</div>
                                            </div>
                                            <div className="text-end">
                                                <div className="text-primary fw-bold">{ua.actions} actions</div>
                                                <div className="small" style={{ color: '#94a3b8' }}>Last: {new Date(ua.lastAction).toLocaleDateString()}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Document Stats */}
                            <div className="col-lg-6">
                                <h5 className="text-white mb-3">📄 Document Status</h5>
                                <div className="p-3" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
                                    {reports.documentStats.map(stat => {
                                        const total = reports.documentStats.reduce((sum, s) => sum + s.count, 0);
                                        const percent = total > 0 ? Math.round((stat.count / total) * 100) : 0;
                                        return (
                                            <div key={stat._id} className="mb-3">
                                                <div className="d-flex justify-content-between small mb-1 text-white">
                                                    <span>{stat._id}</span>
                                                    <span>{stat.count} ({percent}%)</span>
                                                </div>
                                                <div className="progress" style={{ height: '10px', background: 'var(--bg-highlight)' }}>
                                                    <div className="progress-bar" style={{
                                                        width: `${percent}%`,
                                                        background: stat._id === 'Approved' ? 'var(--success)' : stat._id === 'Rejected' ? 'var(--danger)' : 'var(--primary)'
                                                    }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <h5 className="text-white mb-3 mt-4">📅 Weekly Trend</h5>
                                <div className="d-flex gap-2">
                                    {reports.weeklyTrend.map(week => (
                                        <div key={week._id} className="text-center p-2" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', flex: 1 }}>
                                            <div className="text-primary h5 mb-0">{week.count}</div>
                                            <div className="small" style={{ color: '#94a3b8' }}>Week {week._id}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* KNOWLEDGE ASSETS */}
                {!loading && activeTab === 'assets' && assets && (
                    <div className="knowledge-assets">
                        <div className="row g-4">
                            {/* By Domain */}
                            <div className="col-lg-6">
                                <h5 className="text-white mb-3">🏷️ Assets by Domain</h5>
                                <div className="p-3" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
                                    {assets.byDomain.map(domain => (
                                        <div key={domain._id || 'unknown'} className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary">
                                            <span className="text-white">{domain._id || 'Uncategorized'}</span>
                                            <div className="text-end">
                                                <span className="badge bg-primary me-2">{domain.count} docs</span>
                                                {domain.avgRating > 0 && <span className="text-warning">⭐ {domain.avgRating.toFixed(1)}</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Tag Cloud */}
                            <div className="col-lg-6">
                                <h5 className="text-white mb-3">🏷️ Popular Tags</h5>
                                <div className="p-3" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
                                    <div className="d-flex flex-wrap gap-2">
                                        {assets.tagCloud.map(tag => (
                                            <span key={tag._id} className="badge" style={{ background: 'var(--bg-highlight)', color: 'var(--text-primary)', fontSize: `${0.8 + (tag.count / 10) * 0.3}rem` }}>
                                                #{tag._id} ({tag.count})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Top Rated */}
                            <div className="col-lg-6">
                                <h5 className="text-white mb-3">⭐ Top Rated Assets</h5>
                                <div className="p-3" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', maxHeight: '300px', overflowY: 'auto' }}>
                                    {assets.topRated.map(doc => (
                                        <div key={doc._id} className="mb-2 pb-2 border-bottom border-secondary">
                                            <div className="text-white fw-semibold">{doc.title}</div>
                                            <div className="d-flex justify-content-between small">
                                                <span style={{ color: '#94a3b8' }}>{doc.uploader?.name}</span>
                                                <span className="text-warning">⭐ {doc.averageRating.toFixed(1)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Recent */}
                            <div className="col-lg-6">
                                <h5 className="text-white mb-3">🕐 Recently Added</h5>
                                <div className="p-3" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', maxHeight: '300px', overflowY: 'auto' }}>
                                    {assets.recent.map(doc => (
                                        <div key={doc._id} className="mb-2 pb-2 border-bottom border-secondary">
                                            <div className="text-white fw-semibold">{doc.title}</div>
                                            <div className="d-flex justify-content-between small">
                                                <span style={{ color: '#94a3b8' }}>{doc.uploader?.name}</span>
                                                <span style={{ color: '#94a3b8' }}>{new Date(doc.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PMDashboard;
