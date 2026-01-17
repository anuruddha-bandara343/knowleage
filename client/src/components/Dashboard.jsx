import { useState, useEffect } from 'react';
import { documentAPI, reviewAPI } from '../services/api';
import RatingComponent from './RatingComponent';
import CommentSection from './CommentSection';
import PDFViewer from './PDFViewer';
import ITDashboard from './ITDashboard';
import GovernanceDashboard from './GovernanceDashboard';
import NewHireDashboard from './NewHireDashboard';
import PMDashboard from './PMDashboard';
import KCDashboard from './KCDashboard';
import SCDashboard from './SCDashboard';
import ConsultantDashboard from './ConsultantDashboard';
import Feed from './Feed';

const Dashboard = ({ user, searchQuery }) => {
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

    // searchQuery is now coming from props

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const userId = user._id || user.id;
            let response;

            // Use the prop searchQuery here
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
        if (!user || searchQuery) return; // Don't show recs during search
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
                    // Update ratings list for local display
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

    // IT Infrastructure View
    if (user.role === 'ITInfrastructure') {
        return <ITDashboard user={user} />; // Render dedicated dashboard
    }

    // Knowledge Governance Council View
    if (user.role === 'KnowledgeGovernanceCouncil') {
        return <GovernanceDashboard user={user} />;
    }

    // New Hire View
    if (user.role === 'NewHire') {
        return <NewHireDashboard user={user} />;
    }

    // Project Manager View
    if (user.role === 'ProjectManager') {
        return <PMDashboard user={user} />;
    }

    // Knowledge Champion View
    if (user.role === 'KnowledgeChampion') {
        return <KCDashboard user={user} />;
    }

    // Senior Consultant View
    if (user.role === 'SeniorConsultant') {
        return <SCDashboard user={user} />;
    }

    // Consultant View
    if (user.role === 'Consultant') {
        return <ConsultantDashboard user={user} />;
    }

    // Default Fallback / Global View (if no specific role matched or for testing)
    return <Feed user={user} searchQuery={searchQuery} />;
};

export default Dashboard;
