import { useState, useEffect } from 'react';
import { governanceAPI } from '../services/api';
import Feed from './Feed';
import CreateUserForm from './CreateUserForm';

const GovernanceDashboard = ({ user }) => {
    const [activeTab, setActiveTab] = useState('global-feed');
    const [rules, setRules] = useState([]);
    const [logs, setLogs] = useState([]);
    const [flagged, setFlagged] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [newRule, setNewRule] = useState({
        fieldName: '',
        displayName: '',
        isMandatory: false,
        fieldType: 'text',
        validationRegex: '',
        validationMessage: ''
    });

    const userId = user._id || user.id;

    useEffect(() => {
        if (activeTab === 'rules') fetchRules();
        if (activeTab === 'audit') fetchLogs();
        if (activeTab === 'flagged') fetchFlagged();
    }, [activeTab]);

    const fetchRules = async () => {
        setLoading(true);
        try {
            const res = await governanceAPI.getRules(userId);
            setRules(res.data.data);
        } catch (err) {
            console.error('Failed to fetch rules', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await governanceAPI.getAuditLogs({ userId, limit: 100 });
            setLogs(res.data.data);
        } catch (err) {
            console.error('Failed to fetch logs', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchFlagged = async () => {
        setLoading(true);
        try {
            const res = await governanceAPI.getFlaggedDocuments(userId);
            setFlagged(res.data.data);
        } catch (err) {
            console.error('Failed to fetch flagged', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRule = async () => {
        try {
            await governanceAPI.createRule({ ...newRule, userId });
            setNewRule({ fieldName: '', displayName: '', isMandatory: false, fieldType: 'text', validationRegex: '', validationMessage: '' });
            fetchRules();
            alert('Rule created!');
        } catch (err) {
            alert('Failed to create rule');
        }
    };

    const handleUpdateRule = async (id) => {
        try {
            await governanceAPI.updateRule(id, { ...editingRule, userId });
            setEditingRule(null);
            fetchRules();
            alert('Rule updated!');
        } catch (err) {
            alert('Failed to update rule');
        }
    };

    const handleDeleteRule = async (id) => {
        if (!confirm('Delete this rule?')) return;
        try {
            await governanceAPI.deleteRule(id, userId);
            fetchRules();
        } catch (err) {
            alert('Failed to delete rule');
        }
    };

    const handleResolveFlag = async (docId) => {
        try {
            await governanceAPI.toggleFlag(docId, { userId, flag: false });
            fetchFlagged();
            alert('Flag resolved!');
        } catch (err) {
            alert('Failed to resolve flag');
        }
    };

    return (
        <div className="governance-dashboard container mt-4">
            <h2 className="mb-4 text-white">⚖️ Governance Dashboard</h2>

            {/* Tabs */}
            <div className="nav nav-pills mb-4 gap-2">
                <button className={`btn ${activeTab === 'global-feed' ? 'btn-primary' : 'btn-dark'}`} onClick={() => setActiveTab('global-feed')}>
                    🌍 Global Feed
                </button>
                <button className={`btn ${activeTab === 'rules' ? 'btn-primary' : 'btn-dark'}`} onClick={() => setActiveTab('rules')}>
                    📋 Metadata Rules
                </button>
                <button className={`btn ${activeTab === 'audit' ? 'btn-primary' : 'btn-dark'}`} onClick={() => setActiveTab('audit')}>
                    📜 Audit Logs
                </button>
                <button className={`btn ${activeTab === 'flagged' ? 'btn-primary' : 'btn-dark'}`} onClick={() => setActiveTab('flagged')}>
                    🚩 Flagged Content
                </button>
                <button className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-dark'}`} onClick={() => setActiveTab('users')}>
                    👥 User Management
                </button>
            </div>

            <div className="dashboard-content card glass-panel p-4">
                {loading && <div className="text-center text-white"><div className="spinner"></div> Loading...</div>}

                {/* GLOBAL FEED */}
                {activeTab === 'global-feed' && <Feed user={user} />}

                {/* RULES TAB */}
                {!loading && activeTab === 'rules' && (
                    <div className="rules-management text-white">
                        <h4 className="mb-3">Create New Rule</h4>
                        <div className="row g-2 mb-4">
                            <div className="col-md-3">
                                <input type="text" className="form-control bg-dark text-white" placeholder="Field Name" value={newRule.fieldName} onChange={e => setNewRule({ ...newRule, fieldName: e.target.value })} />
                            </div>
                            <div className="col-md-3">
                                <input type="text" className="form-control bg-dark text-white" placeholder="Display Name" value={newRule.displayName} onChange={e => setNewRule({ ...newRule, displayName: e.target.value })} />
                            </div>
                            <div className="col-md-2">
                                <select className="form-select bg-dark text-white" value={newRule.fieldType} onChange={e => setNewRule({ ...newRule, fieldType: e.target.value })}>
                                    <option value="text">Text</option>
                                    <option value="number">Number</option>
                                    <option value="date">Date</option>
                                    <option value="select">Select</option>
                                </select>
                            </div>
                            <div className="col-md-2">
                                <div className="form-check mt-2">
                                    <input type="checkbox" className="form-check-input" checked={newRule.isMandatory} onChange={e => setNewRule({ ...newRule, isMandatory: e.target.checked })} />
                                    <label className="form-check-label">Mandatory</label>
                                </div>
                            </div>
                            <div className="col-md-2">
                                <button className="btn btn-success w-100" onClick={handleCreateRule}>Add Rule</button>
                            </div>
                        </div>

                        <h4 className="mb-3">Existing Rules</h4>
                        <div className="table-responsive">
                            <table className="table table-dark table-hover">
                                <thead>
                                    <tr><th>Field</th><th>Display</th><th>Type</th><th>Mandatory</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    {rules.map(rule => (
                                        <tr key={rule._id}>
                                            <td>{rule.fieldName}</td>
                                            <td>{rule.displayName}</td>
                                            <td><span className="badge bg-secondary">{rule.fieldType}</span></td>
                                            <td>{rule.isMandatory ? '✅' : '❌'}</td>
                                            <td>
                                                <button className="btn btn-sm btn-outline-warning me-2" onClick={() => setEditingRule(rule)}>Edit</button>
                                                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteRule(rule._id)}>Delete</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* AUDIT TAB */}
                {!loading && activeTab === 'audit' && (
                    <div className="audit-logs text-white">
                        <h4 className="mb-3">System Audit Logs</h4>
                        <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                            <table className="table table-dark table-hover table-sm">
                                <thead>
                                    <tr><th>Time</th><th>Actor</th><th>Action</th><th>Target</th><th>Details</th></tr>
                                </thead>
                                <tbody>
                                    {logs.map((log, idx) => (
                                        <tr key={idx}>
                                            <td className="small">{new Date(log.timestamp).toLocaleString()}</td>
                                            <td>{log.actorName} <span className="badge bg-secondary">{log.actorRole}</span></td>
                                            <td><span className={`badge ${log.action === 'APPROVE' ? 'bg-success' : log.action === 'REJECT' ? 'bg-danger' : 'bg-info'}`}>{log.action}</span></td>
                                            <td className="small text-muted">{log.targetId?.substring(0, 8)}...</td>
                                            <td className="small">{log.details}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* FLAGGED TAB */}
                {!loading && activeTab === 'flagged' && (
                    <div className="flagged-content text-white">
                        <h4 className="mb-3">Flagged Documents</h4>
                        {flagged.length === 0 ? (
                            <div className="text-center text-muted py-5">
                                <div className="display-4">✅</div>
                                <p>No flagged content. All clear!</p>
                            </div>
                        ) : (
                            <div className="list-group">
                                {flagged.map(doc => (
                                    <div key={doc._id} className="list-group-item bg-dark text-white border-secondary d-flex justify-content-between align-items-center">
                                        <div>
                                            <strong>{doc.title}</strong>
                                            <div className="small text-danger">🚩 {doc.flagReason}</div>
                                            <div className="small text-muted">Uploaded by: {doc.uploader?.name}</div>
                                        </div>
                                        <button className="btn btn-sm btn-success" onClick={() => handleResolveFlag(doc._id)}>Resolve</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* USERS TAB */}
                {!loading && activeTab === 'users' && (
                    <div className="users-management text-white">
                        <h4 className="mb-3">User Management</h4>
                        <CreateUserForm />
                    </div>
                )}
            </div>

            {/* Edit Rule Modal */}
            {editingRule && (
                <div className="modal-overlay" onClick={() => setEditingRule(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h5>Edit Rule: {editingRule.fieldName}</h5>
                            <button className="close-btn" onClick={() => setEditingRule(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label className="form-label">Display Name</label>
                                <input type="text" className="form-control bg-dark text-white" value={editingRule.displayName || ''} onChange={e => setEditingRule({ ...editingRule, displayName: e.target.value })} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Field Type</label>
                                <select className="form-select bg-dark text-white" value={editingRule.fieldType} onChange={e => setEditingRule({ ...editingRule, fieldType: e.target.value })}>
                                    <option value="text">Text</option>
                                    <option value="number">Number</option>
                                    <option value="date">Date</option>
                                    <option value="select">Select</option>
                                </select>
                            </div>
                            <div className="form-check mb-3">
                                <input type="checkbox" className="form-check-input" checked={editingRule.isMandatory} onChange={e => setEditingRule({ ...editingRule, isMandatory: e.target.checked })} />
                                <label className="form-check-label">Mandatory</label>
                            </div>
                            <button className="btn btn-primary w-100" onClick={() => handleUpdateRule(editingRule._id)}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GovernanceDashboard;
