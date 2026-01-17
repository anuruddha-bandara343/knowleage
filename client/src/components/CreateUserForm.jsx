import { useState } from 'react';
import { authAPI } from '../services/api';

const CreateUserForm = ({ onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'Consultant',
        department: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMsg('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            // we use the same register endpoint. 
            // NOTE: In a real app, 'register' might auto-login. 
            // If the backend 'register' function logs the user in (sets cookie/token), 
            // we might have a side effect here. 
            // However, usually 'register' just creates the user. 
            // If it returns a token, we just ignore it here since we are already logged in as Admin.
            await authAPI.register(formData);
            setSuccessMsg(`User ${formData.name} created successfully!`);
            setFormData({
                name: '',
                email: '',
                password: '',
                confirmPassword: '',
                role: 'Consultant',
                department: ''
            });
            if (onSuccess) onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create user');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-user-form card p-4 bg-dark text-white" style={{ maxWidth: '500px', margin: '0 auto' }}>
            <h3 className="mb-3">➕ Create New User</h3>

            {error && <div className="alert alert-danger">{error}</div>}
            {successMsg && <div className="alert alert-success">{successMsg}</div>}

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label text-white">Full Name</label>
                    <input
                        type="text"
                        name="name"
                        className="form-control bg-dark text-white"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="mb-3">
                    <label className="form-label text-white">Email</label>
                    <input
                        type="email"
                        name="email"
                        className="form-control bg-dark text-white"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label className="form-label text-white">Password</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            className="form-control bg-dark text-white"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            minLength={4}
                        />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label text-white">Confirm Password</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="confirmPassword"
                            className="form-control bg-dark text-white"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            minLength={4}
                        />
                    </div>
                </div>

                <div className="mb-3 form-check">
                    <input
                        type="checkbox"
                        className="form-check-input"
                        id="showPasswordCheck"
                        checked={showPassword}
                        onChange={() => setShowPassword(!showPassword)}
                    />
                    <label className="form-check-label text-white" htmlFor="showPasswordCheck">
                        Show Passwords
                    </label>
                </div>

                <div className="mb-3">
                    <label className="form-label text-white">Role</label>
                    <select
                        name="role"
                        className="form-select bg-dark text-white"
                        value={formData.role}
                        onChange={handleChange}
                    >
                        <option value="Consultant">Consultant</option>
                        <option value="SeniorConsultant">Senior Consultant</option>
                        <option value="KnowledgeChampion">Knowledge Champion</option>
                        <option value="KnowledgeGovernanceCouncil">Knowledge Governance Council</option>
                        <option value="ITInfrastructure">IT Infrastructure</option>

                    </select>
                </div>

                <div className="mb-3">
                    <label className="form-label text-white">Department</label>
                    <input
                        type="text"
                        name="department"
                        className="form-control bg-dark text-white"
                        value={formData.department}
                        onChange={handleChange}
                        placeholder="e.g. IT, HR, Legal"
                    />
                </div>

                <div className="d-flex justify-content-end gap-2">
                    {onCancel && (
                        <button type="button" className="btn btn-secondary" onClick={onCancel}>
                            Cancel
                        </button>
                    )}
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Creating...' : 'Create User'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateUserForm;
