import { useState, useEffect } from 'react';
import { onboardingAPI } from '../services/api';
import Feed from './Feed';

const NewHireDashboard = ({ user }) => {
    const [activeTab, setActiveTab] = useState('onboarding');
    const [modules, setModules] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState(true);

    const userId = user._id || user.id;

    useEffect(() => {
        if (activeTab === 'onboarding') fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [modulesRes, recsRes] = await Promise.all([
                onboardingAPI.getModules(userId),
                onboardingAPI.getRecommendations(userId)
            ]);

            setModules(modulesRes.data.data.modules);
            setProgress(modulesRes.data.data.progress);
            setRecommendations(recsRes.data.data);
        } catch (err) {
            console.error('Failed to fetch onboarding data', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteModule = async (moduleId) => {
        try {
            const res = await onboardingAPI.updateProgress({ userId, moduleId });
            setProgress(res.data.data.progress);
            fetchData(); // Refresh modules
            alert(res.data.data.message);
        } catch (err) {
            alert('Failed to update progress');
        }
    };

    if (loading && activeTab === 'onboarding' && modules.length === 0) {
        return (
            <div className="text-center py-5">
                <div className="spinner"></div>
                <p className="text-muted mt-3">Loading your onboarding...</p>
            </div>
        );
    }

    return (
        <div className="newhire-dashboard container mt-4">
            {/* Navigation Tabs */}
            <div className="nav nav-pills mb-4 gap-2 justify-content-center">
                {['onboarding', 'global-feed'].map(tab => (
                    <button
                        key={tab}
                        className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-dark'}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'onboarding' && '🚀 Onboarding Journey'}
                        {tab === 'global-feed' && '🌍 Global Feed'}
                    </button>
                ))}
            </div>

            {/* GLOBAL FEED */}
            {activeTab === 'global-feed' && <Feed user={user} />}

            {/* Welcome Section */}
            {activeTab === 'onboarding' && (
                <>
                    <div className="welcome-section text-center mb-5">
                        <div className="welcome-icon mb-3" style={{ fontSize: '4rem' }}>🎉</div>
                        <h1 className="text-white mb-2">Welcome, {user.name}!</h1>
                        <p className="text-muted">Let's get you started with your onboarding journey.</p>

                        {/* Progress Bar */}
                        <div className="progress-section mt-4 mx-auto" style={{ maxWidth: '500px' }}>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted small">Onboarding Progress</span>
                                <span className="text-primary fw-bold">{Math.round(progress)}%</span>
                            </div>
                            <div className="progress" style={{ height: '12px', background: 'var(--bg-surface)', borderRadius: '6px' }}>
                                <div
                                    className="progress-bar"
                                    style={{
                                        width: `${progress}%`,
                                        background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                                        borderRadius: '6px',
                                        transition: 'width 0.5s ease'
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* Onboarding Modules */}
                    <div className="modules-section mb-5">
                        <h3 className="text-white mb-4">📚 Learning Modules</h3>
                        <div className="row g-4">
                            {modules.map((module, index) => (
                                <div key={module.id} className="col-md-6 col-lg-4">
                                    <div
                                        className={`module-card p-4 h-100 ${module.completed ? 'completed' : ''}`}
                                        style={{
                                            background: module.completed ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-surface)',
                                            border: `1px solid ${module.completed ? 'var(--success)' : 'var(--border-subtle)'}`,
                                            borderRadius: 'var(--radius-lg)',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <div className="d-flex align-items-start gap-3">
                                            <div className="module-icon" style={{ fontSize: '2.5rem' }}>
                                                {module.completed ? '✅' : module.icon}
                                            </div>
                                            <div className="flex-grow-1">
                                                <h5 className="text-white mb-1">{module.title}</h5>
                                                <p className="text-muted small mb-2">{module.description}</p>
                                                <div className="d-flex align-items-center gap-2">
                                                    <span className="badge bg-dark">⏱ {module.estimatedTime}</span>
                                                    {module.completed ? (
                                                        <span className="badge bg-success">Completed</span>
                                                    ) : (
                                                        <button
                                                            className="btn btn-sm btn-primary"
                                                            onClick={() => handleCompleteModule(module.id)}
                                                        >
                                                            Mark Complete
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recommended Content */}
                    <div className="recommendations-section">
                        <h3 className="text-white mb-4">🤖 Recommended for You</h3>
                        {recommendations.length === 0 ? (
                            <div className="text-center text-muted py-4">
                                <div style={{ fontSize: '3rem' }}>📭</div>
                                <p>No recommendations yet. Check back soon!</p>
                            </div>
                        ) : (
                            <div className="row g-4">
                                {recommendations.slice(0, 6).map(doc => (
                                    <div key={doc._id} className="col-md-6 col-lg-4">
                                        <div
                                            className="rec-card p-4 h-100"
                                            style={{
                                                background: 'var(--bg-surface)',
                                                border: '1px solid var(--border-subtle)',
                                                borderRadius: 'var(--radius-lg)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <h6 className="text-white mb-2">{doc.title}</h6>
                                            <p className="text-muted small mb-2" style={{
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical'
                                            }}>
                                                {doc.description || 'No description available.'}
                                            </p>
                                            <div className="d-flex align-items-center gap-2 mt-auto">
                                                {doc.tags?.slice(0, 2).map(tag => (
                                                    <span key={tag} className="badge bg-primary bg-opacity-25 text-primary">{tag}</span>
                                                ))}
                                                {doc.averageRating > 0 && (
                                                    <span className="ms-auto small text-warning">⭐ {doc.averageRating.toFixed(1)}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Completion Message */}
                    {progress >= 100 && (
                        <div className="completion-banner mt-5 p-4 text-center" style={{
                            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(99, 102, 241, 0.2))',
                            border: '1px solid var(--success)',
                            borderRadius: 'var(--radius-lg)'
                        }}>
                            <div style={{ fontSize: '3rem' }}>🎓</div>
                            <h4 className="text-white mt-2">Congratulations!</h4>
                            <p className="text-muted mb-0">You've completed your onboarding. You're now ready to contribute to the knowledge base!</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default NewHireDashboard;
