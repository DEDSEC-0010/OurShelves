import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Camera, BookOpen, MapPin, AlertCircle, Check, Loader } from 'lucide-react';
import './AddBook.css';

function AddBook() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [lookingUp, setLookingUp] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        isbn: '',
        title: '',
        author: '',
        publisher: '',
        description: '',
        page_count: '',
        cover_url: '',
        condition: 'Good',
        listing_type: 'Lend',
        lending_duration_days: 14,
        latitude: user?.default_latitude || null,
        longitude: user?.default_longitude || null,
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const lookupISBN = async () => {
        if (!formData.isbn.trim()) return;

        setLookingUp(true);
        setError('');

        try {
            const bookData = await api.lookupISBN(formData.isbn.trim());

            if (bookData) {
                setFormData({
                    ...formData,
                    title: bookData.title || formData.title,
                    author: bookData.author || formData.author,
                    publisher: bookData.publisher || formData.publisher,
                    description: bookData.description || formData.description,
                    page_count: bookData.page_count || formData.page_count,
                    cover_url: bookData.cover_url || formData.cover_url,
                });
            } else {
                setError('Book not found. Please enter details manually.');
            }
        } catch (err) {
            setError('Failed to lookup ISBN. Please enter details manually.');
        } finally {
            setLookingUp(false);
        }
    };

    const getLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setFormData({
                    ...formData,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            () => {
                setError('Unable to get location');
            }
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.title.trim()) {
            setError('Title is required');
            return;
        }

        if (!formData.latitude || !formData.longitude) {
            setError('Location is required for book discovery');
            return;
        }

        setLoading(true);

        try {
            await api.createBook({
                ...formData,
                page_count: formData.page_count ? parseInt(formData.page_count) : null,
                lending_duration_days: parseInt(formData.lending_duration_days),
            });
            setSuccess(true);
            setTimeout(() => navigate('/my-books'), 1500);
        } catch (err) {
            setError(err.message || 'Failed to add book');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="page container">
                <div className="add-book-success card">
                    <div className="success-icon">
                        <Check size={48} />
                    </div>
                    <h2>Book Added Successfully!</h2>
                    <p>Your book is now visible to nearby users.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="add-book-page page">
            <div className="container">
                <div className="add-book-layout">
                    <div className="add-book-form-container card">
                        <h1>Add a Book</h1>
                        <p className="add-book-subtitle">
                            Share a book with your community. You can enter the ISBN to auto-fill details.
                        </p>

                        {error && (
                            <div className="alert alert-error">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="add-book-form">
                            {/* ISBN Lookup */}
                            <div className="isbn-lookup">
                                <div className="form-group">
                                    <label className="form-label">ISBN (optional)</label>
                                    <div className="isbn-input">
                                        <input
                                            type="text"
                                            name="isbn"
                                            className="form-input"
                                            placeholder="Enter ISBN to auto-fill"
                                            value={formData.isbn}
                                            onChange={handleChange}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={lookupISBN}
                                            disabled={lookingUp || !formData.isbn.trim()}
                                        >
                                            {lookingUp ? <Loader size={16} className="spinning" /> : 'Look Up'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Book Details */}
                            <div className="form-group">
                                <label className="form-label">Title *</label>
                                <input
                                    type="text"
                                    name="title"
                                    className="form-input"
                                    placeholder="Book title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Author</label>
                                    <input
                                        type="text"
                                        name="author"
                                        className="form-input"
                                        placeholder="Author name"
                                        value={formData.author}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Publisher</label>
                                    <input
                                        type="text"
                                        name="publisher"
                                        className="form-input"
                                        placeholder="Publisher name"
                                        value={formData.publisher}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    name="description"
                                    className="form-input"
                                    placeholder="Brief description of the book"
                                    rows="3"
                                    value={formData.description}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Cover Image URL</label>
                                <input
                                    type="url"
                                    name="cover_url"
                                    className="form-input"
                                    placeholder="https://..."
                                    value={formData.cover_url}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Condition & Type */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Condition *</label>
                                    <select
                                        name="condition"
                                        className="form-select"
                                        value={formData.condition}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="New">New</option>
                                        <option value="Good">Good</option>
                                        <option value="Acceptable">Acceptable</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <select
                                        name="listing_type"
                                        className="form-select"
                                        value={formData.listing_type}
                                        onChange={handleChange}
                                    >
                                        <option value="Lend">Lend Only</option>
                                        <option value="Exchange">Exchange Only</option>
                                        <option value="Both">Lend or Exchange</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Lending Duration (days)</label>
                                <input
                                    type="number"
                                    name="lending_duration_days"
                                    className="form-input"
                                    min="1"
                                    max="90"
                                    value={formData.lending_duration_days}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Location */}
                            <div className="form-group">
                                <label className="form-label">Book Location *</label>
                                <div className="location-section">
                                    {formData.latitude && formData.longitude ? (
                                        <p className="location-detected">
                                            <MapPin size={16} />
                                            Location set ({formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)})
                                        </p>
                                    ) : (
                                        <button type="button" className="btn btn-secondary" onClick={getLocation}>
                                            <MapPin size={16} />
                                            Set Book Location
                                        </button>
                                    )}
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary btn-lg add-book-submit" disabled={loading}>
                                {loading ? <span className="spinner"></span> : 'Add Book'}
                            </button>
                        </form>
                    </div>

                    {/* Preview */}
                    <div className="add-book-preview">
                        <h3>Preview</h3>
                        <div className="preview-card">
                            <div className="preview-cover">
                                {formData.cover_url ? (
                                    <img src={formData.cover_url} alt="Cover preview" />
                                ) : (
                                    <div className="preview-placeholder">
                                        <BookOpen size={32} />
                                    </div>
                                )}
                            </div>
                            <div className="preview-info">
                                <h4>{formData.title || 'Book Title'}</h4>
                                <p>{formData.author || 'Author Name'}</p>
                                <div className="preview-badges">
                                    <span className="badge badge-info">{formData.condition}</span>
                                    <span className="badge badge-success">{formData.listing_type}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddBook;
