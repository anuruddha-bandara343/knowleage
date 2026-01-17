import { useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import Feed from './Feed';
import CreateUserForm from './CreateUserForm';

const ITDashboard = ({ user }) => {
    const [activeTab, setActiveTab] = useState('global-feed');
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState(null);
    const [reports, setReports] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [resetModal, setResetModal] = useState({ open: false, userId: null, userName: '' });
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'health') fetchStats();
        if (activeTab === 'reports') fetchReports();
    }, [activeTab]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await authAPI.getAllUsers(searchTerm);
            setUsers(res.data.data);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await authAPI.getSystemStats();
            setStats(res.data.data);
        } catch (err) {
            console.error('Failed to fetch stats', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchReports = async () => {
        setLoading(true);
        try {
            const res = await authAPI.getSystemReports();
            setReports(res.data.data);
        } catch (err) {
            console.error('Failed to fetch reports', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleUpdate = async (userId, newRole) => {
        try {
            await authAPI.updateUserRole(userId, newRole);
            setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
        } catch (err) {
            alert('Failed to update role');
        }
    };

    const handleToggleStatus = async (userId, currentStatus) => {
        try {
            await authAPI.toggleUserStatus(userId, !currentStatus);
            setUsers(users.map(u => u._id === userId ? { ...u, isActive: !currentStatus } : u));
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handleDelete = async (userId, userName) => {
        if (!confirm(`Delete user "${userName}"? This cannot be undone.`)) return;
        try {
            await authAPI.deleteUser(userId);
            setUsers(users.filter(u => u._id !== userId));
        } catch (err) {
            alert('Failed to delete user');
        }
    };

    const handleResetPassword = async () => {
        if (newPassword.length < 4) {
            alert('Password must be at least 4 characters');
            return;
        }
        try {
            await authAPI.resetUserPassword(resetModal.userId, newPassword);
            alert('Password reset successfully');
            setResetModal({ open: false, userId: null, userName: '' });
            setNewPassword('');
        } catch (err) {
            alert('Failed to reset password');
        }
    };

    const ROLES = ['NewHire', 'Consultant', 'SeniorConsultant', 'ProjectManager', 'KnowledgeChampion', 'KnowledgeGovernanceCouncil', 'ITInfrastructure', 'Admin'];

    const formatUptime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    const formatBytes = (bytes) => {
        const gb = bytes / (1024 * 1024 * 1024);
        return gb.toFixed(2) + ' GB';
    };

    return (
        <div className="it-dashboard container mt-4">
            <h2 className="mb-4 text-white">🖥️ IT Infrastructure Dashboard</h2>

            {/* Navigation Tabs */}
            <div className="nav nav-pills mb-4 gap-2">
                {['global-feed', 'users', 'health', 'reports'].map(tab => (
                    <button
                        key={tab}
                        className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-dark'}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'global-feed' && '🌍 Global Feed'}
                        {tab === 'users' && '👥 User Management'}
                        {tab === 'health' && '❤️ System Health'}
                        {tab === 'reports' && '📊 Reports'}
                    </button>
                ))}
            </div>

            <div className="dashboard-content card p-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
                {loading && <div className="text-center py-5"><div className="spinner"></div></div>}

                {/* GLOBAL FEED */}
                {activeTab === 'global-feed' && <Feed user={user} />}

                {/* USER MANAGEMENT */}
                {!loading && activeTab === 'users' && (
                    <div className="user-management">
                        <div className="mb-4 d-flex gap-2 flex-wrap">
                            <input
                                type="text"
                                className="form-control bg-dark text-white border-secondary"
                                placeholder="Search users..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ maxWidth: '300px' }}
                            />
                            <button className="btn btn-primary" onClick={fetchUsers}>🔍 Search</button>
                            <button className="btn btn-success ms-2 text-white" onClick={() => setShowCreateUser(true)}>➕ Create User</button>
                            <span className="ms-auto small align-self-center" style={{ color: '#94a3b8' }}>{users.length} users found</span>
                        </div>
                        {showCreateUser ? (
                            <div className="mb-4">
                                <CreateUserForm
                                    onSuccess={() => {
                                        setShowCreateUser(false);
                                        fetchUsers();
                                    }}
                                    onCancel={() => setShowCreateUser(false)}
                                />
                            </div>
                        ) : null}
                        <div className="table-responsive">
                            <table className="table table-dark table-hover align-middle">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Status</th>
                                        <th>Role</th>
                                        <th className="text-end">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user._id} className={!user.isActive ? 'opacity-50' : ''}>
                                            <td>
                                                <div className="d-flex align-items-center gap-2">
                                                    <div className="avatar-sm rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', background: 'var(--bg-highlight)', fontSize: '0.9rem' }}>
                                                        {user.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="fw-semibold">{user.name}</div>
                                                        <div className="small" style={{ color: '#94a3b8' }}>{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${user.isActive ? 'bg-success' : 'bg-secondary'}`}>
                                                    {user.isActive ? '● Active' : '○ Disabled'}
                                                </span>
                                            </td>
                                            <td>
                                                <select
                                                    className="form-select form-select-sm bg-dark text-white border-secondary"
                                                    value={user.role}
                                                    onChange={(e) => handleRoleUpdate(user._id, e.target.value)}
                                                    style={{ width: '180px' }}
                                                >
                                                    {ROLES.map(role => (
                                                        <option key={role} value={role}>{role}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>
                                                <div className="d-flex gap-1 justify-content-end">
                                                    <button
                                                        className={`btn btn-sm ${user.isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                                                        onClick={() => handleToggleStatus(user._id, user.isActive)}
                                                        title={user.isActive ? 'Disable' : 'Enable'}
                                                    >
                                                        {user.isActive ? '🚫' : '✅'}
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-info"
                                                        onClick={() => setResetModal({ open: true, userId: user._id, userName: user.name })}
                                                        title="Reset Password"
                                                    >
                                                        🔑
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleDelete(user._id, user.name)}
                                                        title="Delete"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* SYSTEM HEALTH */}
                {!loading && activeTab === 'health' && stats && (
                    <div className="system-health">
                        <div className="row g-4 mb-4">
                            <div className="col-md-3">
                                <div className="stat-card p-4 text-center" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: 'var(--radius-lg)' }}>
                                    <div style={{ fontSize: '2rem' }}>⏱️</div>
                                    <div className="h3 text-white mb-0">{formatUptime(stats.uptime)}</div>
                                    <div className="small text-white-50">Server Uptime</div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="stat-card p-4 text-center" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 'var(--radius-lg)' }}>
                                    <div style={{ fontSize: '2rem' }}>👥</div>
                                    <div className="h3 text-white mb-0">{stats.activeUsers}</div>
                                    <div className="small text-white-50">Active Users</div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="stat-card p-4 text-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: 'var(--radius-lg)' }}>
                                    <div style={{ fontSize: '2rem' }}>📄</div>
                                    <div className="h3 text-white mb-0">{stats.database?.totalDocuments || 0}</div>
                                    <div className="small text-white-50">Total Documents</div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="stat-card p-4 text-center" style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)', borderRadius: 'var(--radius-lg)' }}>
                                    <div style={{ fontSize: '2rem' }}>⏳</div>
                                    <div className="h3 text-white mb-0">{stats.database?.pendingDocuments || 0}</div>
                                    <div className="small text-white-50">Pending Review</div>
                                </div>
                            </div>
                        </div>

                        {/* Memory Usage */}
                        <div className="card bg-dark p-4 mb-4" style={{ borderRadius: 'var(--radius-lg)' }}>
                            <h5 className="text-white mb-3">🧠 Memory Usage</h5>
                            <div className="progress mb-2" style={{ height: '24px', background: 'var(--bg-highlight)' }}>
                                <div className="progress-bar" style={{ width: `${stats.memory.usagePercent}%`, background: stats.memory.usagePercent > 80 ? 'var(--danger)' : 'var(--primary)' }}>
                                    {stats.memory.usagePercent}%
                                </div>
                            </div>
                            <div className="d-flex justify-content-between text-muted small">
                                <span>Used: {formatBytes(stats.memory.used)}</span>
                                <span>Total: {formatBytes(stats.memory.total)}</span>
                            </div>
                        </div>

                        {/* Server Info */}
                        <div className="row g-3 text-white">
                            <div className="col-md-4"><span className="text-muted">Platform:</span> {stats.platform}</div>
                            <div className="col-md-4"><span className="text-muted">CPU Cores:</span> {stats.cpu}</div>
                            <div className="col-md-4"><span className="text-muted">Node.js:</span> {stats.nodeVersion}</div>
                        </div>

                        {/* Role Distribution */}
                        {stats.database?.roleDistribution && (
                            <div className="mt-4">
                                <h5 className="text-white mb-3">👥 Role Distribution</h5>
                                <div className="d-flex flex-wrap gap-2">
                                    {stats.database.roleDistribution.map(r => (
                                        <div key={r._id} className="badge bg-secondary p-2">
                                            {r._id}: <strong>{r.count}</strong>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* REPORTS */}
                {!loading && activeTab === 'reports' && reports && (
                    <div className="reports-view text-white">
                        <div className="row g-4">
                            {/* Daily Activity Chart */}
                            <div className="col-lg-6">
                                <h5 className="mb-3">📈 Daily Activity (Last 7 Days)</h5>
                                <div className="chart-container p-3" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
                                    {reports.dailyActivity.map((day, idx) => {
                                        const maxCount = Math.max(...reports.dailyActivity.map(d => d.count), 1);
                                        const percentage = (day.count / maxCount) * 100;
                                        return (
                                            <div key={day._id} className="mb-3">
                                                <div className="d-flex justify-content-between small mb-1">
                                                    <span>{new Date(day._id).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                                    <span className="text-primary fw-bold">{day.count}</span>
                                                </div>
                                                <div className="progress" style={{ height: '12px', background: 'var(--bg-highlight)' }}>
                                                    <div className="progress-bar" style={{ width: `${percentage}%`, background: `hsl(${240 + idx * 15}, 70%, 60%)` }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Action Distribution */}
                            <div className="col-lg-6">
                                <h5 className="mb-3">🎯 Action Distribution</h5>
                                <div className="chart-container p-3" style={{ background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)' }}>
                                    {reports.actionDistribution.map(action => (
                                        <div key={action._id} className="mb-3">
                                            <div className="d-flex justify-content-between small mb-1">
                                                <span className="d-flex align-items-center gap-1">
                                                    {action._id === 'UPLOAD' && '📤'}
                                                    {action._id === 'APPROVE' && '✅'}
                                                    {action._id === 'REJECT' && '❌'}
                                                    {action._id === 'LOGIN' && '🔐'}
                                                    {action._id}
                                                </span>
                                                <span>{action.count} ({action.percent}%)</span>
                                            </div>
                                            <div className="progress" style={{ height: '12px', background: 'var(--bg-highlight)' }}>
                                                <div
                                                    className="progress-bar"
                                                    style={{
                                                        width: `${action.percent}%`,
                                                        background: action._id === 'APPROVE' ? 'var(--success)' :
                                                            action._id === 'REJECT' ? 'var(--danger)' :
                                                                'var(--primary)'
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="text-center mt-3 text-muted small">
                                        Total Actions: <strong className="text-white">{reports.totalActions}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Reset Password Modal */}
            {resetModal.open && (
                <div className="modal-overlay" onClick={() => setResetModal({ open: false, userId: null, userName: '' })}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h5>🔑 Reset Password</h5>
                            <button className="close-btn" onClick={() => setResetModal({ open: false, userId: null, userName: '' })}>×</button>
                        </div>
                        <div className="modal-body">
                            <p className="text-muted">Resetting password for: <strong className="text-white">{resetModal.userName}</strong></p>
                            <input
                                type="password"
                                className="form-control bg-dark text-white mb-3"
                                placeholder="New Password (min 4 chars)"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                            />
                            <button className="btn btn-primary w-100" onClick={handleResetPassword}>
                                Reset Password
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ITDashboard;
