import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Mail, Lock, User, MapPin, AlertCircle } from 'lucide-react';
import './Auth.css';

function Register() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        address: '',
        latitude: null,
        longitude: null,
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const getLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData({
                    ...formData,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
                setGettingLocation(false);
            },
            (err) => {
                setError('Unable to get your location. Please enter your address manually.');
                setGettingLocation(false);
            }
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (!formData.latitude || !formData.longitude) {
            setError('Please provide your location for local book discovery');
            return;
        }

        setLoading(true);

        try {
            await register({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                latitude: formData.latitude,
                longitude: formData.longitude,
                address: formData.address,
            });
            navigate('/');
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-card auth-card-wide">
                    <div className="auth-logo">
                        <BookOpen size={32} />
                    </div>
                    <h1 className="auth-title">Create Your Account</h1>
                    <p className="auth-subtitle">Join the community and start sharing books today</p>

                    {error && (
                        <div className="alert alert-error">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Full Name</label>
                                <div className="input-with-icon">
                                    <User size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        name="name"
                                        className="form-input"
                                        placeholder="Jane Doe"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <div className="input-with-icon">
                                    <Mail size={18} className="input-icon" />
                                    <input
                                        type="email"
                                        name="email"
                                        className="form-input"
                                        placeholder="you@example.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <div className="input-with-icon">
                                    <Lock size={18} className="input-icon" />
                                    <input
                                        type="password"
                                        name="password"
                                        className="form-input"
                                        placeholder="Min. 8 characters"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Confirm Password</label>
                                <div className="input-with-icon">
                                    <Lock size={18} className="input-icon" />
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        className="form-input"
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Your Location (for local book discovery)</label>
                            <div className="location-input">
                                <div className="input-with-icon flex-1">
                                    <MapPin size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        name="address"
                                        className="form-input"
                                        placeholder="Your neighborhood or address"
                                        value={formData.address}
                                        onChange={handleChange}
                                    />
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={getLocation}
                                    disabled={gettingLocation}
                                >
                                    {gettingLocation ? 'Getting...' : 'Use My Location'}
                                </button>
                            </div>
                            {formData.latitude && (
                                <p className="text-sm text-muted mt-2">
                                    ✓ Location detected ({formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)})
                                </p>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="auth-terms">
                                <input type="checkbox" required />
                                <span>
                                    I agree to the <a href="#">Terms of Service</a> and understand this is a
                                    trust-based platform with no monetary transactions.
                                </span>
                            </label>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
                            {loading ? <span className="spinner"></span> : 'Create Account'}
                        </button>
                    </form>

                    <p className="auth-footer">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Register;
