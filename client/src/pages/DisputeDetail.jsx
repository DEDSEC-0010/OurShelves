import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
    ArrowLeft, AlertTriangle, Clock, CheckCircle, XCircle,
    Upload, BookOpen, User, Calendar, FileText
} from 'lucide-react';
import './DisputeDetail.css';

function DisputeDetail() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [dispute, setDispute] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [evidenceUrl, setEvidenceUrl] = useState('');
    const [addingEvidence, setAddingEvidence] = useState(false);

    useEffect(() => {
        fetchDispute();
    }, [id]);

    const fetchDispute = async () => {
        try {
            const data = await api.getDispute(id);
            setDispute(data.dispute);
        } catch (err) {
            setError('Dispute not found');
        } finally {
            setLoading(false);
        }
    };

    const handleAddEvidence = async (e) => {
        e.preventDefault();
        if (!evidenceUrl.trim()) return;

        setAddingEvidence(true);
        try {
            await api.addDisputeEvidence(id, evidenceUrl);
            setEvidenceUrl('');
            await fetchDispute();
        } catch (err) {
            setError('Failed to add evidence');
        } finally {
            setAddingEvidence(false);
        }
    };

    const getStatusInfo = (status) => {
        const statusMap = {
            Open: {
                icon: <Clock size={24} />,
                color: 'warning',
                description: 'Your dispute has been submitted and is awaiting review.',
            },
            UnderReview: {
                icon: <AlertTriangle size={24} />,
                color: 'info',
                description: 'Our team is currently reviewing your dispute.',
            },
            Resolved: {
                icon: <CheckCircle size={24} />,
                color: 'success',
                description: 'This dispute has been resolved.',
            },
            Closed: {
                icon: <XCircle size={24} />,
                color: 'muted',
                description: 'This dispute has been closed.',
            },
        };
        return statusMap[status] || statusMap.Open;
    };

    if (loading) {
        return (
            <div className="page flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    if (error && !dispute) {
        return (
            <div className="page container">
                <div className="empty-state">
                    <AlertTriangle size={64} className="empty-state-icon" />
                    <h3 className="empty-state-title">{error}</h3>
                    <button onClick={() => navigate('/disputes')} className="btn btn-primary mt-4">
                        Back to Disputes
                    </button>
                </div>
            </div>
        );
    }

    const statusInfo = getStatusInfo(dispute.status);
    const isReporter = dispute.reporter_id === user?.id;

    return (
        <div className="dispute-detail-page page">
            <div className="container">
                <button onClick={() => navigate('/disputes')} className="back-link">
                    <ArrowLeft size={18} />
                    Back to disputes
                </button>

                {error && (
                    <div className="alert alert-error mb-4">{error}</div>
                )}

                {/* Status Banner */}
                <div className={`status-banner status-${statusInfo.color}`}>
                    {statusInfo.icon}
                    <div>
                        <h2>Status: {dispute.status}</h2>
                        <p>{statusInfo.description}</p>
                    </div>
                </div>

                <div className="dispute-detail-layout">
                    <div className="dispute-main card">
                        {/* Dispute Info */}
                        <div className="dispute-section">
                            <h3>
                                <FileText size={18} />
                                Dispute Details
                            </h3>
                            <div className="dispute-reason">
                                <strong>Reason:</strong> {dispute.reason}
                            </div>
                            {dispute.description && (
                                <div className="dispute-description">
                                    <strong>Description:</strong>
                                    <p>{dispute.description}</p>
                                </div>
                            )}
                        </div>

                        {/* Book Info */}
                        <div className="dispute-section">
                            <h3>
                                <BookOpen size={18} />
                                Related Transaction
                            </h3>
                            <div className="dispute-book-info">
                                <div>
                                    <span className="label">Book:</span>
                                    <span>{dispute.book_title}</span>
                                </div>
                                {dispute.book_author && (
                                    <div>
                                        <span className="label">Author:</span>
                                        <span>{dispute.book_author}</span>
                                    </div>
                                )}
                                <Link to={`/transactions/${dispute.transaction_id}`} className="btn btn-ghost btn-sm">
                                    View Transaction
                                </Link>
                            </div>
                        </div>

                        {/* Parties */}
                        <div className="dispute-section">
                            <h3>
                                <User size={18} />
                                Parties Involved
                            </h3>
                            <div className="dispute-parties">
                                <div className="party-item">
                                    <span className="party-role">Reporter:</span>
                                    <span className="party-name">{dispute.reporter_name}</span>
                                    {isReporter && <span className="badge badge-primary">You</span>}
                                </div>
                                <div className="party-item">
                                    <span className="party-role">Reported:</span>
                                    <span className="party-name">{dispute.reported_name}</span>
                                    {!isReporter && <span className="badge badge-primary">You</span>}
                                </div>
                            </div>
                        </div>

                        {/* Evidence */}
                        <div className="dispute-section">
                            <h3>
                                <Upload size={18} />
                                Evidence
                            </h3>

                            {dispute.evidence_urls && dispute.evidence_urls.length > 0 ? (
                                <div className="evidence-list">
                                    {dispute.evidence_urls.map((url, idx) => (
                                        <a
                                            key={idx}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="evidence-item"
                                        >
                                            Evidence #{idx + 1}
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted">No evidence submitted yet.</p>
                            )}

                            {dispute.status === 'Open' && isReporter && (
                                <form onSubmit={handleAddEvidence} className="add-evidence-form">
                                    <input
                                        type="url"
                                        placeholder="Paste evidence URL (image, document, etc.)"
                                        value={evidenceUrl}
                                        onChange={(e) => setEvidenceUrl(e.target.value)}
                                        className="form-input"
                                    />
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={!evidenceUrl.trim() || addingEvidence}
                                    >
                                        {addingEvidence ? 'Adding...' : 'Add Evidence'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Timeline Sidebar */}
                    <div className="dispute-timeline card">
                        <h3>Timeline</h3>
                        <div className="timeline">
                            <div className="timeline-item active">
                                <div className="timeline-dot"></div>
                                <div className="timeline-content">
                                    <span className="timeline-title">Dispute Filed</span>
                                    <span className="timeline-date">
                                        {new Date(dispute.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            {dispute.status !== 'Open' && (
                                <div className="timeline-item active">
                                    <div className="timeline-dot"></div>
                                    <div className="timeline-content">
                                        <span className="timeline-title">Under Review</span>
                                    </div>
                                </div>
                            )}
                            {['Resolved', 'Closed'].includes(dispute.status) && (
                                <div className="timeline-item active">
                                    <div className="timeline-dot"></div>
                                    <div className="timeline-content">
                                        <span className="timeline-title">{dispute.status}</span>
                                        {dispute.resolution && (
                                            <p className="timeline-resolution">{dispute.resolution}</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DisputeDetail;
