import { useState } from 'react';
import { authAPI } from '../services/api';

const Login = ({ onLogin }) => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {


            const response = await authAPI.login(formData.email, formData.password);
            onLogin(response.data.data.user);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card card">
                <div className="login-header">
                    <div className="login-logo">🔷</div>
                    <h1 className="login-brand">KnowledgeShare</h1>
                    <p className="login-subtitle">Digital Knowledge Network</p>
                </div>

                {error && <div className="alert alert-error">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label text-white">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            placeholder="name@velion.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label text-white">Password</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            name="password"
                            className="form-input"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group d-flex align-items-center mb-3">
                        <input
                            type="checkbox"
                            className="form-check-input me-2"
                            id="loginShowPassword"
                            checked={showPassword}
                            onChange={() => setShowPassword(!showPassword)}
                        />
                        <label className="text-white small mb-0" htmlFor="loginShowPassword" style={{ cursor: 'pointer' }}>
                            Show Password
                        </label>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-full"
                        disabled={loading}
                    >
                        {loading ? 'Signing In...' : '🔐 Sign In'}
                    </button>
                </form>

                <div className="login-footer">
                    <p>💡 Access the Digital Knowledge Network</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
