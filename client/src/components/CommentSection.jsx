import { useState } from 'react';

const CommentSection = ({ docId, comments = [], user, onAddComment }) => {
    const [newComment, setNewComment] = useState('');
    const [showComments, setShowComments] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        onAddComment(docId, newComment);
        setNewComment('');
    };

    const getUserInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="comment-section">
            {/* Toggle Button (Only if comments exist) */}
            {comments.length > 0 && (
                <div className="comment-actions">
                    <button
                        className="btn-comment-toggle"
                        onClick={() => setShowComments(!showComments)}
                    >
                        {showComments ? 'Hide comments' : `View all ${comments.length} comments`}
                    </button>
                </div>
            )}

            {/* Comment List (Collapsible) */}
            {showComments && comments.length > 0 && (
                <div className="comments-container">
                    <div className="comments-list">
                        {comments.map((comment, index) => (
                            <div key={index} className="comment">
                                <div className="comment-avatar">
                                    {getUserInitials(comment.user?.name || 'User')}
                                </div>
                                <div className="comment-bubble">
                                    <div className="comment-header">
                                        <span className="comment-author">{comment.user?.name || 'Unknown'}</span>
                                        <span className="comment-time">{formatDate(comment.createdAt)}</span>
                                    </div>
                                    <p className="comment-text">{comment.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Always Visible Input Form */}
            <form className="comment-form" onSubmit={handleSubmit}>
                <div className="comment-avatar small">
                    {getUserInitials(user?.name)}
                </div>
                <input
                    type="text"
                    className="comment-input"
                    placeholder="Write a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                />
                <button type="submit" className="btn-send" disabled={!newComment.trim()}>
                    ➤
                </button>
            </form>
        </div>
    );
};

export default CommentSection;
