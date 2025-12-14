import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { User, Star, MapPin, Calendar, BookOpen, Award, AlertCircle, Check } from 'lucide-react';
import './Profile.css';

function Profile() {
    const { id } = useParams();
    const { user: currentUser, updateProfile } = useAuth();
    const [profile, setProfile] = useState(null);
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({});

    const isOwnProfile = !id || id === currentUser?.id?.toString();

    useEffect(() => {
        fetchProfile();
    }, [id, currentUser]);

    const fetchProfile = async () => {
        try {
            if (isOwnProfile) {
                const data = await api.getProfile();
                setProfile(data.user);
                setFormData({
                    name: data.user.name || '',
                    phone: data.user.phone || '',
                    default_address: data.user.default_address || '',
                });
            } else {
                const data = await api.getUserProfile(id);
                setProfile(data.user);
            }

            // Fetch ratings
            const ratingsData = await api.getUserRatings(isOwnProfile ? currentUser?.id : id);
            setRatings(ratingsData.ratings || []);
        } catch (err) {
            setError('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setError('');
        setSuccess('');

        try {
            await updateProfile(formData);
            setSuccess('Profile updated successfully');
            setEditing(false);
        } catch (err) {
            setError(err.message || 'Failed to update profile');
        }
    };

    if (loading) {
        return (
            <div className="page flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    if (error && !profile) {
        return (
            <div className="page container">
                <div className="empty-state">
                    <User size={64} className="empty-state-icon" />
                    <h3 className="empty-state-title">{error}</h3>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-page page">
            <div className="container">
                <div className="profile-layout">
                    <div className="profile-main">
                        {/* Profile Header */}
                        <div className="profile-header card">
                            <div className="profile-avatar">
                                {profile.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="profile-info">
                                {editing ? (
                                    <input
                                        type="text"
                                        className="form-input profile-name-input"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                ) : (
                                    <h1>{profile.name}</h1>
                                )}
                                <div className="profile-rating">
                                    <Star size={18} fill="currentColor" />
                                    <span className="rating-value">
                                        {profile.avg_rating > 0 ? profile.avg_rating.toFixed(1) : 'New User'}
                                    </span>
                                    <span className="rating-count">({profile.total_ratings || 0} ratings)</span>
                                </div>
                                <p className="profile-joined">
                                    <Calendar size={14} />
                                    Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                </p>
                            </div>
                            {isOwnProfile && (
                                <div className="profile-actions">
                                    {editing ? (
                                        <>
                                            <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
                                            <button className="btn btn-primary" onClick={handleSave}>Save</button>
                                        </>
                                    ) : (
                                        <button className="btn btn-secondary" onClick={() => setEditing(true)}>Edit Profile</button>
                                    )}
                                </div>
                            )}
                        </div>

                        {(error || success) && (
                            <div className={`alert ${error ? 'alert-error' : 'alert-success'}`}>
                                {error ? <AlertCircle size={18} /> : <Check size={18} />}
                                {error || success}
                            </div>
                        )}

                        {/* Stats */}
                        <div className="profile-stats">
                            <div className="stat-card card">
                                <BookOpen size={24} />
                                <div className="stat-value">{profile.completed_transactions || 0}</div>
                                <div className="stat-label">Exchanges</div>
                            </div>
                            <div className="stat-card card">
                                <Star size={24} />
                                <div className="stat-value">{profile.avg_rating > 0 ? profile.avg_rating.toFixed(1) : '-'}</div>
                                <div className="stat-label">Avg Rating</div>
                            </div>
                            {profile.on_time_return_percentage !== undefined && (
                                <div className="stat-card card">
                                    <Award size={24} />
                                    <div className="stat-value">{profile.on_time_return_percentage}%</div>
                                    <div className="stat-label">On-Time Returns</div>
                                </div>
                            )}
                        </div>

                        {/* Settings (own profile only) */}
                        {isOwnProfile && editing && (
                            <div className="profile-settings card">
                                <h3>Profile Settings</h3>
                                <div className="form-group">
                                    <label className="form-label">Phone (optional)</label>
                                    <input
                                        type="tel"
                                        className="form-input"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="Your phone number"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Default Address</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.default_address}
                                        onChange={(e) => setFormData({ ...formData, default_address: e.target.value })}
                                        placeholder="Your neighborhood or city"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Ratings Sidebar */}
                    <div className="profile-sidebar">
                        <div className="card">
                            <h3>Recent Reviews</h3>
                            {ratings.length === 0 ? (
                                <p className="no-ratings">No reviews yet</p>
                            ) : (
                                <div className="ratings-list">
                                    {ratings.map((rating) => (
                                        <div key={rating.id} className="rating-item">
                                            <div className="rating-header">
                                                <span className="rating-from">{rating.rater_name}</span>
                                                <div className="rating-stars">
                                                    {[1, 2, 3, 4, 5].map(n => (
                                                        <Star key={n} size={12} fill={n <= rating.score ? 'currentColor' : 'none'} />
                                                    ))}
                                                </div>
                                            </div>
                                            {rating.comment && (
                                                <p className="rating-comment">{rating.comment}</p>
                                            )}
                                            <span className="rating-date">
                                                {new Date(rating.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Profile;
