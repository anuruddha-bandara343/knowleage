import { useState, useEffect } from 'react';
import { documentAPI, reviewAPI, SERVER_URL } from '../services/api';
import RatingComponent from './RatingComponent';
import CommentSection from './CommentSection';
import PDFViewer from './PDFViewer';

const Feed = ({ user, searchQuery }) => {
    const [documents, setDocuments] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerFile, setViewerFile] = useState({ url: '', name: '' });

    // History Modal State
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyData, setHistoryData] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const userId = user._id || user.id;
            let response;

            if (searchQuery && searchQuery.trim()) {
                response = await documentAPI.search({
                    userId,
                    query: searchQuery
                });
            } else {
                response = await documentAPI.getAll(userId);
            }

            setDocuments(response.data.data);
            setError('');
        } catch (err) {
            setError('Failed to load documents. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRecommendations = async () => {
        if (!user || searchQuery) return;
        try {
            const userId = user._id || user.id;
            const response = await documentAPI.getRecommendations(userId);
            setRecommendations(response.data.data);
        } catch (err) {
            console.error('Failed to load recommendations:', err);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (user?._id || user?.id) {
                fetchDocuments();
                fetchRecommendations();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [user, searchQuery]);

    const handleViewHistory = async (docId) => {
        try {
            setHistoryLoading(true);
            setHistoryOpen(true);
            const userId = user._id || user.id;
            const response = await documentAPI.getHistory(docId, userId);
            setHistoryData(response.data.data);
        } catch (err) {
            console.error('Failed to load history:', err);
            setHistoryData([]);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleApprove = async (docId) => {
        try {
            const userId = user._id || user.id;
            await reviewAPI.approve(docId, userId);
            setDocuments(prev => prev.map(doc =>
                doc._id === docId ? { ...doc, status: 'Approved' } : doc
            ));
        } catch (err) {
            console.error('Approve error:', err);
        }
    };

    const handleReject = async (docId) => {
        const reason = prompt('Enter rejection reason:');
        if (reason) {
            try {
                const userId = user._id || user.id;
                await reviewAPI.reject(docId, userId, reason);
                setDocuments(prev => prev.map(doc =>
                    doc._id === docId ? { ...doc, status: 'Rejected', rejectionReason: reason } : doc
                ));
            } catch (err) {
                console.error('Reject error:', err);
            }
        }
    };

    const handleRate = async (docId, rating) => {
        try {
            const userId = user._id || user.id;
            const response = await documentAPI.rate(docId, userId, rating);

            setDocuments(prev => prev.map(doc => {
                if (doc._id === docId) {
                    const newRating = { user: userId, rating };
                    const existingIdx = doc.ratings.findIndex(r => r.user === userId || r.user?._id === userId);
                    let updatedRatings = [...doc.ratings];

                    if (existingIdx > -1) {
                        updatedRatings[existingIdx] = { ...updatedRatings[existingIdx], rating };
                    } else {
                        updatedRatings.push(newRating);
                    }

                    return {
                        ...doc,
                        averageRating: response.data.data.averageRating,
                        ratings: updatedRatings
                    };
                }
                return doc;
            }));
        } catch (err) {
            console.error('Rate error:', err);
        }
    };

    const handleAddComment = async (docId, text) => {
        try {
            const userId = user._id || user.id;
            const response = await documentAPI.addComment(docId, userId, text);
            const newComment = response.data.data;

            setDocuments(prev => prev.map(doc =>
                doc._id === docId ? { ...doc, comments: [...doc.comments, newComment] } : doc
            ));
        } catch (err) {
            console.error('Comment error:', err);
        }
    };

    const handleLike = async (docId) => {
        try {
            const userId = user._id || user.id;
            const response = await documentAPI.toggleLike(docId, userId);
            const { isLiked, likesCount } = response.data;

            setDocuments(prev => prev.map(doc => {
                if (doc._id === docId) {
                    let updatedLikes = [...(doc.likes || [])];
                    if (isLiked) {
                        updatedLikes.push(userId);
                    } else {
                        updatedLikes = updatedLikes.filter(id => id !== userId);
                    }
                    return { ...doc, likes: updatedLikes };
                }
                return doc;
            }));
        } catch (err) {
            console.error('Like error:', err);
        }
    };

    const getStatusClass = (status) => {
        const classes = {
            'Approved': 'status-approved',
            'Rejected': 'status-rejected',
            'Pending': 'status-pending',
            'Draft': 'status-draft',
            'Archived': 'status-archived'
        };
        return classes[status] || 'status-pending';
    };

    const getTimeAgo = (date) => {
        const now = new Date();
        const past = new Date(date);
        const diffMs = now - past;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return past.toLocaleDateString();
    };

    const getFileTypeIcon = (fileUrl) => {
        if (!fileUrl) return '📄';
        const ext = fileUrl.split('.').pop()?.toLowerCase();
        const icons = {
            pdf: '📕', doc: '📘', docx: '📘',
            xls: '📗', xlsx: '📗',
            ppt: '📙', pptx: '📙',
            jpg: '🖼️', jpeg: '🖼️', png: '🖼️', gif: '🖼️',
            zip: '📦', rar: '📦'
        };
        return icons[ext] || '📄';
    };

    const getUserInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const canReview = ['KnowledgeGovernanceCouncil', 'Admin', 'SeniorConsultant', 'ITInfrastructure'].includes(user.role);

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="feed-container">
            {/* Feed Header */}
            <div className="feed-header">
                <h1 className="feed-title">📚 Knowledge Feed</h1>
                <p className="feed-subtitle">
                    {user.role === 'Consultant'
                        ? 'Viewing approved documents'
                        : `${documents.length} documents in repository`}
                </p>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {/* Recommendations Section */}
            {!searchQuery && recommendations.length > 0 && (
                <div className="recommendations-section mb-4">
                    <h3 className="section-title">✨ Recommended for You</h3>
                    <div className="recommendations-grid">
                        {recommendations.map(doc => (
                            <div key={doc._id} className="recommendation-card" onClick={() => {
                                setViewerFile({
                                    url: doc.versions?.[doc.versions.length - 1]?.fileUrl || '',
                                    name: doc.title
                                });
                                setViewerOpen(true);
                            }}>
                                <div className="rec-icon">{getFileTypeIcon(doc.versions?.[doc.versions.length - 1]?.fileUrl)}</div>
                                <div className="rec-info">
                                    <div className="rec-title">{doc.title}</div>
                                    <div className="rec-meta">by {doc.uploader?.name}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {documents.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">📭</div>
                    <h3>No documents yet</h3>
                    <p>Be the first to share knowledge!</p>
                </div>
            ) : (
                <div className="feed">
                    {documents.map((doc) => (
                        <article key={doc._id} className={`fb-post ${doc.isSensitive ? 'post-sensitive' : ''}`}>
                            {/* Post Header */}
                            <div className="fb-post-header">
                                <div className="fb-avatar">
                                    {getUserInitials(doc.uploader?.name)}
                                </div>
                                <div className="fb-user-info">
                                    <div className="fb-username">{doc.uploader?.name || 'Unknown'}</div>
                                    <div className="fb-post-meta">
                                        <span>{getTimeAgo(doc.createdAt)}</span>
                                        <span className="fb-dot">·</span>
                                        <span className={`fb-status ${getStatusClass(doc.status)}`}>{doc.status}</span>
                                        {doc.domain && (
                                            <>
                                                <span className="fb-dot">·</span>
                                                <span className="fb-domain">{doc.domain}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <button className="fb-more-btn">•••</button>
                            </div>

                            {/* Post Content */}
                            <div className="fb-post-content">
                                <h3 className="fb-post-title">
                                    {getFileTypeIcon(doc.versions?.[doc.versions.length - 1]?.fileUrl)} {doc.title}
                                </h3>
                                {doc.description && (
                                    <p className="fb-post-text">{doc.description}</p>
                                )}

                                {doc.tags?.length > 0 && (
                                    <div className="fb-tags">
                                        {doc.tags.map((tag, idx) => (
                                            <span key={idx} className="fb-tag">#{tag}</span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Media Preview */}
                            {(doc.fileUrls?.length > 0 || (doc.versions?.length > 0 && doc.versions[doc.versions.length - 1]?.fileUrl?.startsWith('/uploads/'))) && (
                                <div className={`fb-media-preview ${(doc.fileUrls?.length || 1) > 1 ? 'fb-media-grid' : ''}`}>
                                    {doc.fileUrls?.length > 0 ? (
                                        doc.fileUrls.filter(url => url.startsWith('/uploads/')).slice(0, 4).map((fileUrl, idx) => (
                                            fileUrl.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? (
                                                <div
                                                    key={idx}
                                                    className={`fb-grid-item ${idx === 3 && doc.fileUrls.length > 4 ? 'fb-grid-more' : ''}`}
                                                    onClick={() => {
                                                        setViewerFile({ url: fileUrl, name: doc.title });
                                                        setViewerOpen(true);
                                                    }}
                                                >
                                                    <img
                                                        src={`${SERVER_URL}${fileUrl}`}
                                                        alt={`${doc.title} ${idx + 1}`}
                                                        className="fb-preview-image"
                                                    />
                                                    {idx === 3 && doc.fileUrls.length > 4 && (
                                                        <div className="fb-more-overlay">+{doc.fileUrls.length - 4}</div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div
                                                    key={idx}
                                                    className="fb-preview-pdf fb-grid-item"
                                                    onClick={() => {
                                                        setViewerFile({ url: fileUrl, name: doc.title, id: doc._id, status: doc.status });
                                                        setViewerOpen(true);
                                                    }}
                                                >
                                                    <iframe
                                                        src={`${SERVER_URL}${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                                                        className="fb-pdf-iframe"
                                                        title={`${doc.title} ${idx + 1}`}
                                                    />
                                                    <div className="fb-preview-overlay">
                                                        <span className="fb-preview-expand">🔍 Click to expand</span>
                                                    </div>
                                                </div>
                                            )
                                        ))
                                    ) : (
                                        doc.versions[doc.versions.length - 1].fileUrl.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp)$/) ? (
                                            <img
                                                src={`${SERVER_URL}${doc.versions[doc.versions.length - 1].fileUrl}`}
                                                alt={doc.title}
                                                className="fb-preview-image"
                                                onClick={() => {
                                                    setViewerFile({ url: doc.versions[doc.versions.length - 1].fileUrl, name: doc.title });
                                                    setViewerOpen(true);
                                                }}
                                            />
                                        ) : (
                                            <div
                                                className="fb-preview-pdf"
                                                onClick={() => {
                                                    setViewerFile({ url: doc.versions[doc.versions.length - 1].fileUrl, name: doc.title });
                                                    setViewerOpen(true);
                                                }}
                                            >
                                                <iframe
                                                    src={`${SERVER_URL}${doc.versions[doc.versions.length - 1].fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                                                    className="fb-pdf-iframe"
                                                    title={doc.title}
                                                />
                                                <div className="fb-preview-overlay">
                                                    <span className="fb-preview-expand">🔍 Click to expand</span>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            )}

                            {/* Engagement Stats */}
                            <div className="fb-engagement">
                                <div className="fb-reactions">
                                    <span className="fb-reaction-icons">❤️</span>
                                    <span>{doc.likes?.length || 0} likes</span>
                                    <span className="fb-dot">·</span>
                                    <span className="fb-reaction-icons">⭐</span>
                                    <span>{doc.averageRating?.toFixed(1) || 0} rating</span>
                                </div>
                                <div className="fb-counts">
                                    <span>{doc.comments?.length || 0} comments</span>
                                    {doc.region && <span>· 🌍 {doc.region}</span>}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="fb-actions">
                                <button
                                    className={`fb-action-btn ${(doc.likes || []).includes(user._id || user.id) ? 'liked' : ''}`}
                                    onClick={() => handleLike(doc._id)}
                                >
                                    <span>{(doc.likes || []).includes(user._id || user.id) ? '❤️' : '🤍'}</span>
                                    <span>Like</span>
                                </button>
                                <div className="fb-action-group">
                                    <RatingComponent
                                        docId={doc._id}
                                        initialRating={doc.ratings?.find(r => r.user === (user._id || user.id))?.rating || 0}
                                        averageRating={doc.averageRating || 0}
                                        onRate={(rating) => handleRate(doc._id, rating)}
                                        compact={true}
                                    />
                                </div>
                                {doc.versions?.length > 0 && doc.versions[doc.versions.length - 1]?.fileUrl &&
                                    doc.versions[doc.versions.length - 1].fileUrl.startsWith('/uploads/') && (
                                        <a
                                            href={`${SERVER_URL}${doc.versions[doc.versions.length - 1].fileUrl}`}
                                            download
                                            className="fb-action-btn"
                                        >
                                            <span>⬇️</span>
                                            <span>Download</span>
                                        </a>
                                    )}

                                {(user.role === 'Admin' || user.role === 'SeniorConsultant' || doc.uploader?._id === (user._id || user.id)) && (
                                    <button
                                        className="fb-action-btn"
                                        onClick={() => handleViewHistory(doc._id)}
                                        title="View Document History"
                                    >
                                        <span>🕒</span>
                                        <span>History</span>
                                    </button>
                                )}
                            </div>

                            {/* Review Actions */}
                            {canReview && doc.status === 'Pending' && (
                                <div className="fb-review-actions">
                                    <button onClick={() => handleApprove(doc._id)} className="fb-approve-btn">✓ Approve</button>
                                    <button onClick={() => handleReject(doc._id)} className="fb-reject-btn">✕ Reject</button>
                                </div>
                            )}

                            {/* Compliance Warning */}
                            {doc.complianceNotes && (
                                <div className="fb-warning">⚠️ {doc.complianceNotes}</div>
                            )}

                            <CommentSection
                                docId={doc._id}
                                comments={doc.comments || []}
                                user={user}
                                onAddComment={handleAddComment}
                            />
                        </article>
                    ))}
                </div>
            )}

            <div className="d-md-none" style={{ height: '100px' }}></div>

            {viewerOpen && (
                <PDFViewer
                    fileUrl={viewerFile.url}
                    fileName={viewerFile.name}
                    onClose={() => setViewerOpen(false)}
                    docId={viewerFile.id}
                    docStatus={viewerFile.status}
                    isReviewer={canReview}
                    onApprove={handleApprove}
                    onReject={handleReject}
                />
            )}

            {historyOpen && (
                <div className="modal-overlay" onClick={() => setHistoryOpen(false)}>
                    <div className="modal-content history-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Document History</h3>
                            <button className="close-btn" onClick={() => setHistoryOpen(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {historyLoading ? (
                                <div className="spinner"></div>
                            ) : historyData.length === 0 ? (
                                <p>No history found.</p>
                            ) : (
                                <ul className="history-list">
                                    {historyData.map((log, index) => (
                                        <li key={index} className="history-item">
                                            <div className="history-meta">
                                                <span className="history-time">{new Date(log.timestamp).toLocaleString()}</span>
                                                <span className="history-actor">{log.actorName} ({log.actorRole})</span>
                                            </div>
                                            <div className="history-action">
                                                <strong>{log.action}</strong>
                                                {log.details && <span className="history-details">: {log.details}</span>}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Feed;
