import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { BookOpen, MapPin, Star, Calendar, User, ArrowLeft, AlertCircle, Check } from 'lucide-react';
import './BookDetail.css';

function BookDetail() {
    const { id } = useParams();
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();
    const [book, setBook] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [requesting, setRequesting] = useState(false);
    const [requestSuccess, setRequestSuccess] = useState(false);

    useEffect(() => {
        fetchBook();
    }, [id]);

    const fetchBook = async () => {
        try {
            const data = await api.getBook(id);
            setBook(data.book);
        } catch (err) {
            setError('Book not found');
        } finally {
            setLoading(false);
        }
    };

    const handleRequest = async () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        setRequesting(true);
        setError('');

        try {
            await api.createTransaction(book.id);
            setRequestSuccess(true);
        } catch (err) {
            setError(err.message || 'Failed to request book');
        } finally {
            setRequesting(false);
        }
    };

    if (loading) {
        return (
            <div className="page flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    if (error && !book) {
        return (
            <div className="page container">
                <div className="empty-state">
                    <BookOpen size={64} className="empty-state-icon" />
                    <h3 className="empty-state-title">{error}</h3>
                    <Link to="/search" className="btn btn-primary mt-4">
                        Back to Search
                    </Link>
                </div>
            </div>
        );
    }

    const isOwner = user && user.id === book.owner_id;
    const conditionColors = {
        New: 'badge-success',
        Good: 'badge-info',
        Acceptable: 'badge-warning',
    };

    return (
        <div className="book-detail-page page">
            <div className="container">
                <button onClick={() => navigate(-1)} className="back-link">
                    <ArrowLeft size={18} />
                    Back to results
                </button>

                <div className="book-detail">
                    <div className="book-detail-cover">
                        {book.cover_url ? (
                            <img src={book.cover_url} alt={book.title} />
                        ) : (
                            <div className="book-detail-placeholder">
                                <BookOpen size={64} />
                            </div>
                        )}
                    </div>

                    <div className="book-detail-info">
                        <div className="book-detail-badges">
                            <span className={`badge ${conditionColors[book.condition]}`}>
                                {book.condition}
                            </span>
                            <span className="badge badge-info">
                                {book.listing_type === 'Both' ? 'Lend or Exchange' : book.listing_type}
                            </span>
                            <span className={`badge ${book.status === 'Available' ? 'badge-success' : 'badge-warning'}`}>
                                {book.status}
                            </span>
                        </div>

                        <h1 className="book-detail-title">{book.title}</h1>
                        <p className="book-detail-author">by {book.author || 'Unknown Author'}</p>

                        {book.description && (
                            <p className="book-detail-description">{book.description}</p>
                        )}

                        <div className="book-detail-meta">
                            {book.publisher && (
                                <div className="meta-item">
                                    <span className="meta-label">Publisher</span>
                                    <span className="meta-value">{book.publisher}</span>
                                </div>
                            )}
                            {book.page_count && (
                                <div className="meta-item">
                                    <span className="meta-label">Pages</span>
                                    <span className="meta-value">{book.page_count}</span>
                                </div>
                            )}
                            {book.isbn && (
                                <div className="meta-item">
                                    <span className="meta-label">ISBN</span>
                                    <span className="meta-value">{book.isbn}</span>
                                </div>
                            )}
                            <div className="meta-item">
                                <span className="meta-label">Lending Period</span>
                                <span className="meta-value">{book.lending_duration_days} days</span>
                            </div>
                        </div>

                        <div className="book-detail-owner card">
                            <div className="owner-header">
                                <div className="owner-avatar">
                                    {book.owner_name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="owner-info">
                                    <h4>{book.owner_name}</h4>
                                    <div className="owner-stats">
                                        <span className="owner-rating">
                                            <Star size={14} fill="currentColor" />
                                            {book.owner_rating > 0 ? book.owner_rating.toFixed(1) : 'New'}
                                        </span>
                                        <span>•</span>
                                        <span>{book.owner_transactions || 0} exchanges</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="alert alert-error">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        {requestSuccess ? (
                            <div className="alert alert-success">
                                <Check size={18} />
                                Request sent! The owner will review your request.
                                <Link to="/transactions" className="btn btn-primary btn-sm" style={{ marginLeft: 'auto' }}>
                                    View Transactions
                                </Link>
                            </div>
                        ) : (
                            <div className="book-detail-actions">
                                {isOwner ? (
                                    <Link to={`/my-books`} className="btn btn-primary btn-lg">
                                        Manage in My Books
                                    </Link>
                                ) : book.status === 'Available' ? (
                                    <button
                                        className="btn btn-accent btn-lg"
                                        onClick={handleRequest}
                                        disabled={requesting}
                                    >
                                        {requesting ? <span className="spinner"></span> : 'Request This Book'}
                                    </button>
                                ) : (
                                    <button className="btn btn-secondary btn-lg" disabled>
                                        Currently Unavailable
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BookDetail;
