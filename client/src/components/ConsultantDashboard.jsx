import { useState, useEffect } from 'react';
import { consultantAPI, documentAPI } from '../services/api';
import Feed from './Feed';
import PDFViewer from './PDFViewer';

const ConsultantDashboard = ({ user }) => {
    const [activeTab, setActiveTab] = useState('global-feed');
    const [uploads, setUploads] = useState(null);
    const [recommendations, setRecommendations] = useState([]);
    const [activity, setActivity] = useState(null);
    const [allDocs, setAllDocs] = useState([]);
    const [loading, setLoading] = useState(false);

    // Viewer State
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerFile, setViewerFile] = useState({ url: '', name: '' });

    const userId = user._id || user.id;

    useEffect(() => {
        if (activeTab === 'uploads') fetchUploads();
        if (activeTab === 'feed') fetchRecommendations();
        if (activeTab === 'activity') fetchActivity();
    }, [activeTab]);

    const fetchUploads = async () => {
        setLoading(true);
        try {
            const res = await consultantAPI.getMyUploads(userId);
            setUploads(res.data.data);
        } catch (err) {
            console.error('Failed to fetch uploads', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecommendations = async () => {
        setLoading(true);
        try {
            const [recRes, docsRes] = await Promise.all([
                consultantAPI.getRecommendations(userId),
                documentAPI.getAll()
            ]);
            // Backend now returns a flat array of "smart" recommendations
            setRecommendations(recRes.data.data);
            // Filter only approved for "Recent" list
            setAllDocs(docsRes.data.data.filter(d => d.status === 'Approved'));
        } catch (err) {
            console.error('Failed to fetch', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchActivity = async () => {
        setLoading(true);
        try {
            const res = await consultantAPI.getMyActivity(userId);
            setActivity(res.data.data);
        } catch (err) {
            console.error('Failed to fetch activity', err);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Approved': return 'bg-success';
            case 'Rejected': return 'bg-danger';
            case 'Pending': return 'bg-warning text-dark';
            default: return 'bg-secondary';
        }
    };

    const openViewer = (doc) => {
        const fileUrl = doc.versions?.[doc.versions.length - 1]?.fileUrl;
        if (fileUrl) {
            setViewerFile({
                url: fileUrl,
                name: doc.title,
                id: doc._id,
                status: doc.status
            });
            setViewerOpen(true);
        }
    };

    return (
        <div className="consultant-dashboard container mt-4">
            <h2 className="mb-4 text-white">💼 Consultant Dashboard</h2>

            {/* Navigation Tabs */}
            <div className="nav nav-pills mb-4 gap-2">
                {['global-feed', 'feed', 'uploads', 'activity'].map(tab => (
                    <button
                        key={tab}
                        className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-dark'}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'global-feed' && '🌍 Global Feed'}
                        {tab === 'feed' && '🤖 AI Recommendations'}
                        {tab === 'uploads' && '📤 My Uploads'}
                        {tab === 'activity' && '📊 My Activity'}
                    </button>
                ))}
            </div>

            <div className="dashboard-content card p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
                {loading && <div className="text-center py-5"><div className="spinner"></div></div>}

                {/* GLOBAL FEED */}
                {activeTab === 'global-feed' && <Feed user={user} />}

                {/* AI RECOMMENDATIONS / KNOWLEDGE FEED */}
                {!loading && activeTab === 'feed' && (
                    <div className="knowledge-feed">
                        {/* For You Section (AI RECS) */}
                        <h5 className="text-white mb-3">🎯 Recommended For You</h5>
                        {recommendations.length === 0 ? (
                            <p className="text-white-50">No specific recommendations yet. Interact with more content!</p>
                        ) : (
                            <div className="row g-3 mb-4">
                                {recommendations.map(doc => (
                                    <div key={doc._id} className="col-md-6 col-lg-4">
                                        <div
                                            className="card bg-dark h-100 p-3"
                                            style={{ borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', cursor: 'pointer' }}
                                            onClick={() => openViewer(doc)}
                                        >
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <div className="text-white fw-semibold">{doc.title}</div>
                                                {doc.recommendationReason && (
                                                    <span className="badge bg-primary bg-gradient" style={{ fontSize: '0.7rem' }}>
                                                        {doc.recommendationReason}
                                                    </span>
                                                )}
                                            </div>

                                            <p className="small mb-2" style={{ color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                                {doc.description || 'No description'}
                                            </p>
                                            <div className="mt-auto d-flex justify-content-between align-items-center">
                                                <span className="badge bg-info">{doc.domain || 'General'}</span>
                                                {doc.averageRating > 0 && <span className="text-warning">⭐ {doc.averageRating.toFixed(1)}</span>}
                                            </div>
                                            <div className="small mt-2" style={{ color: '#94a3b8' }}>by {doc.uploader?.name}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Recent Highlights (From All Docs) */}
                        <h5 className="text-white mb-3">🆕 Recent Additions</h5>
                        <div className="row g-3">
                            {allDocs.slice(0, 4).map(doc => (
                                <div key={doc._id} className="col-md-6">
                                    <div
                                        className="d-flex gap-3 p-3"
                                        style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}
                                        onClick={() => openViewer(doc)}
                                    >
                                        <div className="flex-grow-1">
                                            <div className="text-white fw-semibold">{doc.title}</div>
                                            <div className="small" style={{ color: '#94a3b8' }}>by {doc.uploader?.name}</div>
                                        </div>
                                        <span className="badge bg-secondary align-self-start">{new Date(doc.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Browse All */}
                        <h5 className="text-white mb-3 mt-4">📚 Browse Repository ({allDocs.length})</h5>
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            {allDocs.slice(0, 20).map(doc => (
                                <div
                                    key={doc._id}
                                    className="d-flex justify-content-between align-items-center p-2 mb-2"
                                    style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                                    onClick={() => openViewer(doc)}
                                >
                                    <div>
                                        <span className="text-white">{doc.title}</span>
                                        <span className="badge bg-dark border border-secondary ms-2">{doc.domain || 'General'}</span>
                                    </div>
                                    {doc.averageRating > 0 && <span className="text-warning small">⭐ {doc.averageRating.toFixed(1)}</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* MY UPLOADS */}
                {!loading && activeTab === 'uploads' && uploads && (
                    <div className="my-uploads">
                        {/* Stats */}
                        <div className="row g-3 mb-4">
                            <div className="col-6 col-md-3">
                                <div className="stat-card p-3 text-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 'var(--radius-lg)' }}>
                                    <div className="h4 text-white mb-0">{uploads.stats.total}</div>
                                    <div className="small text-white-50">Total</div>
                                </div>
                            </div>
                            <div className="col-6 col-md-3">
                                <div className="stat-card p-3 text-center" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: 'var(--radius-lg)' }}>
                                    <div className="h4 text-white mb-0">{uploads.stats.approved}</div>
                                    <div className="small text-white-50">Approved</div>
                                </div>
                            </div>
                            <div className="col-6 col-md-3">
                                <div className="stat-card p-3 text-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: 'var(--radius-lg)' }}>
                                    <div className="h4 text-white mb-0">{uploads.stats.pending}</div>
                                    <div className="small text-white-50">Pending</div>
                                </div>
                            </div>
                            <div className="col-6 col-md-3">
                                <div className="stat-card p-3 text-center" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', borderRadius: 'var(--radius-lg)' }}>
                                    <div className="h4 text-white mb-0">{uploads.stats.rejected}</div>
                                    <div className="small text-white-50">Rejected</div>
                                </div>
                            </div>
                        </div>

                        {/* Upload List */}
                        <h5 className="text-white mb-3">📄 My Documents</h5>
                        {uploads.uploads.length === 0 ? (
                            <div className="text-center py-5">
                                <div style={{ fontSize: '3rem' }}>📭</div>
                                <p className="text-white-50">You haven't uploaded any documents yet.</p>
                            </div>
                        ) : (
                            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {uploads.uploads.map(doc => (
                                    <div key={doc._id} className="card bg-dark mb-2 p-3" style={{ borderRadius: 'var(--radius-md)' }}>
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div>
                                                <div className="text-white fw-semibold">{doc.title}</div>
                                                <div className="small" style={{ color: '#94a3b8' }}>{doc.domain || 'General'} • {new Date(doc.createdAt).toLocaleDateString()}</div>
                                            </div>
                                            <div className="text-end">
                                                <span className={`badge ${getStatusColor(doc.status)}`}>{doc.status}</span>
                                                {doc.averageRating > 0 && <div className="text-warning small mt-1">⭐ {doc.averageRating.toFixed(1)}</div>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* MY ACTIVITY */}
                {!loading && activeTab === 'activity' && activity && (
                    <div className="my-activity">
                        {/* User Stats */}
                        <div className="row g-4 mb-4">
                            <div className="col-md-4">
                                <div className="p-4 text-center" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
                                    <div className="h3 text-warning mb-0">⭐ {activity.user?.score || 0}</div>
                                    <div className="small" style={{ color: '#94a3b8' }}>Total Points</div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="p-4 text-center" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
                                    <div className="h3 text-primary mb-0">{activity.feedback?.rated || 0}</div>
                                    <div className="small" style={{ color: '#94a3b8' }}>Docs Rated</div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="p-4 text-center" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
                                    <div className="h3 text-success mb-0">{activity.feedback?.commented || 0}</div>
                                    <div className="small" style={{ color: '#94a3b8' }}>Comments</div>
                                </div>
                            </div>
                        </div>

                        {/* Badges */}
                        {activity.user?.badges?.length > 0 && (
                            <div className="mb-4">
                                <h5 className="text-white mb-3">🏆 My Badges</h5>
                                <div className="d-flex flex-wrap gap-2">
                                    {activity.user.badges.map((badge, idx) => (
                                        <span key={idx} className="badge bg-warning text-dark p-2">{badge.icon || '🏆'} {badge.name}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Activity Summary */}
                        <h5 className="text-white mb-3">📊 Activity Summary</h5>
                        <div className="row g-3 mb-4">
                            {activity.activitySummary?.map(as => (
                                <div key={as._id} className="col-6 col-md-3">
                                    <div className="p-3 text-center" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)' }}>
                                        <div className="h5 text-primary mb-0">{as.count}</div>
                                        <div className="small" style={{ color: '#94a3b8' }}>{as._id}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Recent Activity */}
                        <h5 className="text-white mb-3">🕐 Recent Activity</h5>
                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {activity.recentActivity?.slice(0, 10).map((act, idx) => (
                                <div key={idx} className="d-flex justify-content-between p-2 mb-1" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                                    <span className="badge bg-secondary">{act.action}</span>
                                    <span className="small" style={{ color: '#94a3b8' }}>{new Date(act.timestamp).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Document Viewer Modal */}
            {viewerOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999 }}>
                    <PDFViewer
                        fileUrl={viewerFile.url}
                        fileName={viewerFile.name}
                        onClose={() => setViewerOpen(false)}
                        docId={viewerFile.id}
                        docStatus={viewerFile.status}
                        isReviewer={false} // Consultants generally don't review from Recs tab
                    />
                </div>
            )}
        </div>
    );
};

export default ConsultantDashboard;
