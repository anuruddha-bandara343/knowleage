import { useState, useEffect } from 'react';
import { scAPI, reviewAPI } from '../services/api';
import Feed from './Feed';

const SCDashboard = ({ user }) => {
    const [activeTab, setActiveTab] = useState('global-feed');
    const [pendingData, setPendingData] = useState(null);
    const [curation, setCuration] = useState(null);
    const [usage, setUsage] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (activeTab === 'review') fetchPending();
        if (activeTab === 'curation') fetchCuration();
        if (activeTab === 'usage') fetchUsage();
    }, [activeTab]);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const res = await scAPI.getPendingReviews();
            setPendingData(res.data.data);
        } catch (err) {
            console.error('Failed to fetch pending', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchCuration = async () => {
        setLoading(true);
        try {
            const res = await scAPI.getRepositoryCuration();
            setCuration(res.data.data);
        } catch (err) {
            console.error('Failed to fetch curation', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsage = async () => {
        setLoading(true);
        try {
            const res = await scAPI.getUsageMonitoring();
            setUsage(res.data.data);
        } catch (err) {
            console.error('Failed to fetch usage', err);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (docId, status) => {
        try {
            const userId = user._id || user.id;
            await reviewAPI.updateStatus(docId, userId, status);
            fetchPending();
        } catch (err) {
            console.error('Review error:', err);
            alert('Failed to update status');
        }
    };

    return (
        <div className="sc-dashboard container mt-4">
            <h2 className="mb-4 text-white">📋 Senior Consultant Dashboard</h2>

            {/* Navigation Tabs */}
            <div className="nav nav-pills mb-4 gap-2">
                {['global-feed', 'review', 'curation', 'usage'].map(tab => (
                    <button
                        key={tab}
                        className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-dark'}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'global-feed' && '🌍 Global Feed'}
                        {tab === 'review' && '✅ Content Review'}
                        {tab === 'curation' && '📚 Repository Curation'}
                        {tab === 'usage' && '📊 Usage Monitor'}
                    </button>
                ))}
            </div>

            <div className="dashboard-content card p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
                {loading && <div className="text-center py-5"><div className="spinner"></div></div>}

                {/* GLOBAL FEED */}
                {activeTab === 'global-feed' && <Feed user={user} />}

                {/* CONTENT REVIEW */}
                {!loading && activeTab === 'review' && pendingData && (
                    <div className="content-review">
                        {/* Stats */}
                        <div className="row g-4 mb-4">
                            <div className="col-md-3">
                                <div className="stat-card p-3 text-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: 'var(--radius-lg)' }}>
                                    <div className="h3 text-white mb-0">{pendingData.stats.totalPending}</div>
                                    <div className="small text-white-50">Pending Review</div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="stat-card p-3 text-center" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: 'var(--radius-lg)' }}>
                                    <div className="h3 text-white mb-0">{pendingData.stats.approved}</div>
                                    <div className="small text-white-50">Approved</div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="stat-card p-3 text-center" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', borderRadius: 'var(--radius-lg)' }}>
                                    <div className="h3 text-white mb-0">{pendingData.stats.rejected}</div>
                                    <div className="small text-white-50">Rejected</div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="stat-card p-3 text-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 'var(--radius-lg)' }}>
                                    <div className="h3 text-white mb-0">{pendingData.stats.total}</div>
                                    <div className="small text-white-50">Total Docs</div>
                                </div>
                            </div>
                        </div>

                        {/* Pending List */}
                        <h5 className="text-white mb-3">📝 Pending Documents</h5>
                        {pendingData.pending.length === 0 ? (
                            <div className="text-center py-5 text-muted">
                                <div style={{ fontSize: '3rem' }}>✅</div>
                                <p>No pending documents to review!</p>
                            </div>
                        ) : (
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {pendingData.pending.map(doc => (
                                    <div key={doc._id} className="card bg-dark mb-2 p-3" style={{ borderRadius: 'var(--radius-md)' }}>
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div className="flex-grow-1">
                                                <div className="text-white fw-semibold">{doc.title}</div>
                                                <div className="small" style={{ color: '#94a3b8' }}>{doc.description?.substring(0, 100)}...</div>
                                                <div className="mt-1">
                                                    <span className="badge bg-secondary me-2">By: {doc.uploader?.name}</span>
                                                    <span className="badge bg-info">{doc.domain || 'No domain'}</span>
                                                </div>
                                            </div>
                                            <div className="d-flex gap-2">
                                                <button className="btn btn-sm btn-success" onClick={() => handleReview(doc._id, 'Approved')}>✓ Approve</button>
                                                <button className="btn btn-sm btn-danger" onClick={() => handleReview(doc._id, 'Rejected')}>✗ Reject</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* REPOSITORY CURATION */}
                {!loading && activeTab === 'curation' && curation && (
                    <div className="repository-curation">
                        <div className="row g-4">
                            {/* Status Breakdown */}
                            <div className="col-lg-6">
                                <h5 className="text-white mb-3">📊 Document Status</h5>
                                <div className="p-3" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
                                    {curation.byStatus.map(s => (
                                        <div key={s._id} className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom border-secondary">
                                            <span className={`badge ${s._id === 'Approved' ? 'bg-success' : s._id === 'Rejected' ? 'bg-danger' : 'bg-warning'}`}>{s._id}</span>
                                            <span className="text-white fw-bold">{s.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Domain Breakdown */}
                            <div className="col-lg-6">
                                <h5 className="text-white mb-3">🏷️ By Domain</h5>
                                <div className="p-3" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', maxHeight: '200px', overflowY: 'auto' }}>
                                    {curation.byDomain.map(d => (
                                        <div key={d._id || 'none'} className="d-flex justify-content-between align-items-center mb-2">
                                            <span className="text-white">{d._id || 'Uncategorized'}</span>
                                            <span className="badge bg-primary">{d.count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Issues */}
                            <div className="col-lg-4">
                                <h5 className="text-white mb-3">⚠️ Low Rated</h5>
                                <div className="p-3" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', maxHeight: '200px', overflowY: 'auto' }}>
                                    {curation.issueFlags.lowRated.length === 0 ? (
                                        <p className="text-muted small text-center">None</p>
                                    ) : (
                                        curation.issueFlags.lowRated.map(doc => (
                                            <div key={doc._id} className="mb-2 pb-2 border-bottom border-secondary">
                                                <div className="text-white small">{doc.title}</div>
                                                <span className="text-danger small">⭐ {doc.averageRating?.toFixed(1)}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="col-lg-4">
                                <h5 className="text-white mb-3">📅 Stale Content</h5>
                                <div className="p-3" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', maxHeight: '200px', overflowY: 'auto' }}>
                                    {curation.issueFlags.stale.length === 0 ? (
                                        <p className="text-muted small text-center">None</p>
                                    ) : (
                                        curation.issueFlags.stale.map(doc => (
                                            <div key={doc._id} className="mb-2 pb-2 border-bottom border-secondary">
                                                <div className="text-white small">{doc.title}</div>
                                                <span className="small" style={{ color: '#94a3b8' }}>Updated: {new Date(doc.updatedAt).toLocaleDateString()}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="col-lg-4">
                                <h5 className="text-white mb-3">🏷️ Missing Tags</h5>
                                <div className="p-3" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', maxHeight: '200px', overflowY: 'auto' }}>
                                    {curation.issueFlags.untagged.length === 0 ? (
                                        <p className="text-muted small text-center">None</p>
                                    ) : (
                                        curation.issueFlags.untagged.map(doc => (
                                            <div key={doc._id} className="mb-2 pb-2 border-bottom border-secondary">
                                                <div className="text-white small">{doc.title}</div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* USAGE MONITOR */}
                {!loading && activeTab === 'usage' && usage && (
                    <div className="usage-monitor">
                        <div className="row g-4">
                            {/* Daily Trend */}
                            <div className="col-lg-8">
                                <h5 className="text-white mb-3">📈 Daily Activity (30 days)</h5>
                                <div className="p-3" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
                                    <div className="d-flex align-items-end gap-1" style={{ height: '120px' }}>
                                        {usage.dailyActivity.slice(-14).map((day, idx) => {
                                            const maxCount = Math.max(...usage.dailyActivity.map(d => d.count), 1);
                                            const height = (day.count / maxCount) * 100;
                                            return (
                                                <div key={idx} className="text-center flex-fill">
                                                    <div
                                                        style={{ height: `${height}%`, minHeight: '4px', background: 'var(--primary)', borderRadius: '4px 4px 0 0' }}
                                                        title={`${day._id}: ${day.count}`}
                                                    ></div>
                                                    <div className="small" style={{ color: '#94a3b8', fontSize: '0.6rem' }}>{day._id?.slice(-2)}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* Top Uploaders */}
                            <div className="col-lg-4">
                                <h5 className="text-white mb-3">🏆 Top Uploaders</h5>
                                <div className="p-3" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
                                    {usage.topUploaders.map((u, idx) => (
                                        <div key={idx} className="d-flex justify-content-between align-items-center mb-2">
                                            <span className="text-white">{idx + 1}. {u.name}</span>
                                            <span className="badge bg-success">{u.uploads}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Action Breakdown */}
                            <div className="col-lg-6">
                                <h5 className="text-white mb-3">🎯 Action Breakdown</h5>
                                <div className="p-3" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
                                    {usage.actionBreakdown.map(action => {
                                        const total = usage.actionBreakdown.reduce((sum, a) => sum + a.count, 0);
                                        const percent = total > 0 ? Math.round((action.count / total) * 100) : 0;
                                        return (
                                            <div key={action._id} className="mb-2">
                                                <div className="d-flex justify-content-between small text-white mb-1">
                                                    <span>{action._id}</span>
                                                    <span>{action.count} ({percent}%)</span>
                                                </div>
                                                <div className="progress" style={{ height: '6px', background: 'var(--bg-highlight)' }}>
                                                    <div className="progress-bar" style={{ width: `${percent}%`, background: 'var(--primary)' }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Recent Activity */}
                            <div className="col-lg-6">
                                <h5 className="text-white mb-3">🕐 Recent Activity</h5>
                                <div className="p-3" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', maxHeight: '200px', overflowY: 'auto' }}>
                                    {usage.recentActivity.map((act, idx) => (
                                        <div key={idx} className="d-flex justify-content-between mb-2 pb-2 border-bottom border-secondary">
                                            <div>
                                                <span className="badge bg-secondary me-2">{act.action}</span>
                                                <span className="small text-white">{act.actorName}</span>
                                            </div>
                                            <span className="small" style={{ color: '#94a3b8' }}>{new Date(act.timestamp).toLocaleString()}</span>
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

export default SCDashboard;
