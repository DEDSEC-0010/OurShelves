import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ArrowLeft, BookOpen, Star, Check, X, AlertCircle, Clock, MessageCircle } from 'lucide-react';
import Chat from '../components/Chat';
import './TransactionDetail.css';

function TransactionDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [transaction, setTransaction] = useState(null);
    const [ratings, setRatings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState('');
    const [rejectReason, setRejectReason] = useState('');
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showRatingModal, setShowRatingModal] = useState(false);
    const [ratingData, setRatingData] = useState({ score: 5, comment: '' });

    useEffect(() => {
        fetchTransaction();
    }, [id]);

    const fetchTransaction = async () => {
        try {
            const data = await api.getTransaction(id);
            setTransaction(data.transaction);
            setRatings(data.ratings || []);
        } catch (err) {
            setError('Transaction not found');
        } finally {
            setLoading(false);
        }
    };

    const isOwner = transaction?.owner_id === user?.id;
    const isBorrower = transaction?.borrower_id === user?.id;
    const hasRated = ratings.some(r => r.rater_id === user?.id);

    const handleApprove = async () => {
        setActionLoading(true);
        try {
            await api.approveTransaction(id);
            await fetchTransaction();
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!rejectReason.trim()) return;
        setActionLoading(true);
        try {
            await api.rejectTransaction(id, rejectReason);
            await fetchTransaction();
            setShowRejectModal(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleConfirmPickup = async () => {
        setActionLoading(true);
        try {
            await api.confirmPickup(id);
            await fetchTransaction();
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleConfirmReturn = async () => {
        setActionLoading(true);
        try {
            await api.confirmReturn(id);
            await fetchTransaction();
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleSubmitRating = async () => {
        setActionLoading(true);
        try {
            await api.rateTransaction(id, ratingData);
            await fetchTransaction();
            setShowRatingModal(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="page flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    if (error && !transaction) {
        return (
            <div className="page container">
                <div className="empty-state">
                    <AlertCircle size={64} className="empty-state-icon" />
                    <h3 className="empty-state-title">{error}</h3>
                    <button onClick={() => navigate(-1)} className="btn btn-primary mt-4">
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const statusSteps = ['Requested', 'Approved', 'PickedUp', 'Completed'];
    const currentStep = statusSteps.indexOf(transaction.status);

    return (
        <div className="transaction-detail-page page">
            <div className="container">
                <button onClick={() => navigate(-1)} className="back-link">
                    <ArrowLeft size={18} />
                    Back to transactions
                </button>

                {error && (
                    <div className="alert alert-error mb-4">
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <div className="transaction-detail-layout">
                    <div className="transaction-main card">
                        {/* Status Progress */}
                        <div className="status-progress">
                            {statusSteps.map((step, idx) => (
                                <div key={step} className={`status-step ${idx <= currentStep ? 'active' : ''}`}>
                                    <div className="status-dot">
                                        {idx < currentStep ? <Check size={12} /> : idx + 1}
                                    </div>
                                    <span>{step === 'PickedUp' ? 'In Transit' : step}</span>
                                </div>
                            ))}
                        </div>

                        {/* Book Info */}
                        <div className="transaction-book-info">
                            <div className="book-cover">
                                {transaction.book_cover ? (
                                    <img src={transaction.book_cover} alt={transaction.book_title} />
                                ) : (
                                    <div className="book-placeholder">
                                        <BookOpen size={32} />
                                    </div>
                                )}
                            </div>
                            <div className="book-details">
                                <h2>{transaction.book_title}</h2>
                                <p className="book-author">{transaction.book_author}</p>
                                {transaction.book_condition && (
                                    <span className="badge badge-info">{transaction.book_condition}</span>
                                )}
                            </div>
                        </div>

                        {/* Transaction Details */}
                        <div className="transaction-parties">
                            <div className="party">
                                <span className="party-label">Lender</span>
                                <div className="party-info">
                                    <div className="party-avatar">{transaction.owner_name?.charAt(0)}</div>
                                    <div>
                                        <span className="party-name">{transaction.owner_name}</span>
                                        <span className="party-rating">
                                            <Star size={12} fill="currentColor" />
                                            {transaction.owner_rating?.toFixed(1) || 'New'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="party-arrow">→</div>
                            <div className="party">
                                <span className="party-label">Borrower</span>
                                <div className="party-info">
                                    <div className="party-avatar">{transaction.borrower_name?.charAt(0)}</div>
                                    <div>
                                        <span className="party-name">{transaction.borrower_name}</span>
                                        <span className="party-rating">
                                            <Star size={12} fill="currentColor" />
                                            {transaction.borrower_rating?.toFixed(1) || 'New'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {transaction.due_date && (
                            <div className="transaction-dates">
                                <div className="date-item">
                                    <Clock size={16} />
                                    <span>Due: {new Date(transaction.due_date).toLocaleDateString()}</span>
                                </div>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="transaction-actions">
                            {isOwner && transaction.status === 'Requested' && (
                                <>
                                    <button className="btn btn-primary" onClick={handleApprove} disabled={actionLoading}>
                                        <Check size={16} />
                                        Approve Request
                                    </button>
                                    <button className="btn btn-secondary" onClick={() => setShowRejectModal(true)} disabled={actionLoading}>
                                        <X size={16} />
                                        Reject
                                    </button>
                                </>
                            )}

                            {transaction.status === 'Approved' && (
                                <button className="btn btn-primary" onClick={handleConfirmPickup} disabled={actionLoading}>
                                    <Check size={16} />
                                    {isOwner
                                        ? (transaction.pickup_confirmed_owner ? 'Waiting for borrower...' : 'Confirm Handoff')
                                        : (transaction.pickup_confirmed_borrower ? 'Waiting for lender...' : 'Confirm Pickup')
                                    }
                                </button>
                            )}

                            {isOwner && ['PickedUp', 'Overdue'].includes(transaction.status) && (
                                <button className="btn btn-primary" onClick={handleConfirmReturn} disabled={actionLoading}>
                                    <Check size={16} />
                                    Confirm Return
                                </button>
                            )}

                            {transaction.status === 'Completed' && !hasRated && (
                                <button className="btn btn-accent" onClick={() => setShowRatingModal(true)}>
                                    <Star size={16} />
                                    Rate This Exchange
                                </button>
                            )}
                        </div>

                        {/* Chat Section - for approved/active transactions */}
                        {['Approved', 'PickedUp', 'Overdue'].includes(transaction.status) && (
                            <div className="transaction-chat">
                                <h3>
                                    <MessageCircle size={18} />
                                    Messages
                                </h3>
                                <Chat transactionId={id} currentUserId={user?.id} />
                            </div>
                        )}
                    </div>

                    {/* Ratings sidebar */}
                    {ratings.length > 0 && (
                        <div className="transaction-ratings card">
                            <h3>Ratings</h3>
                            {ratings.map((rating) => (
                                <div key={rating.id} className="rating-item">
                                    <div className="rating-header">
                                        <span className="rating-by">{rating.rater_name}</span>
                                        <div className="rating-stars">
                                            {[1, 2, 3, 4, 5].map(n => (
                                                <Star key={n} size={14} fill={n <= rating.score ? 'currentColor' : 'none'} />
                                            ))}
                                        </div>
                                    </div>
                                    {rating.comment && <p className="rating-comment">{rating.comment}</p>}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3>Reject Request</h3>
                        <p>Please provide a reason for rejecting this request:</p>
                        <textarea
                            className="form-input"
                            rows="3"
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="e.g., Book is no longer available"
                        />
                        <div className="modal-actions">
                            <button className="btn btn-ghost" onClick={() => setShowRejectModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleReject} disabled={!rejectReason.trim() || actionLoading}>
                                Reject Request
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rating Modal */}
            {showRatingModal && (
                <div className="modal-overlay" onClick={() => setShowRatingModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3>Rate Your Experience</h3>
                        <div className="rating-input">
                            <p>How was your exchange with {isOwner ? transaction.borrower_name : transaction.owner_name}?</p>
                            <div className="star-input">
                                {[1, 2, 3, 4, 5].map(n => (
                                    <button
                                        key={n}
                                        className={`star-btn ${n <= ratingData.score ? 'active' : ''}`}
                                        onClick={() => setRatingData({ ...ratingData, score: n })}
                                    >
                                        <Star size={28} fill={n <= ratingData.score ? 'currentColor' : 'none'} />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <textarea
                            className="form-input"
                            rows="3"
                            value={ratingData.comment}
                            onChange={(e) => setRatingData({ ...ratingData, comment: e.target.value })}
                            placeholder="Optional: Add a comment about your experience"
                        />
                        <div className="modal-actions">
                            <button className="btn btn-ghost" onClick={() => setShowRatingModal(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSubmitRating} disabled={actionLoading}>
                                Submit Rating
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TransactionDetail;
