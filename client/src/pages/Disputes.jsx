import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { AlertTriangle, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import './Disputes.css';

function Disputes() {
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDisputes();
    }, []);

    const fetchDisputes = async () => {
        try {
            const data = await api.getDisputes();
            setDisputes(data.disputes || []);
        } catch (err) {
            setError('Failed to load disputes');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Open':
                return <Clock className="status-icon status-open" />;
            case 'UnderReview':
                return <AlertTriangle className="status-icon status-review" />;
            case 'Resolved':
                return <CheckCircle className="status-icon status-resolved" />;
            case 'Closed':
                return <XCircle className="status-icon status-closed" />;
            default:
                return <Clock className="status-icon" />;
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="page flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="disputes-page page">
            <div className="container">
                <header className="disputes-header">
                    <h1>My Disputes</h1>
                    <p>Track and manage your reported issues</p>
                </header>

                {error && (
                    <div className="alert alert-error">{error}</div>
                )}

                {disputes.length === 0 ? (
                    <div className="empty-state">
                        <AlertTriangle size={64} className="empty-state-icon" />
                        <h3 className="empty-state-title">No disputes</h3>
                        <p className="empty-state-description">
                            You haven't filed any disputes yet. If you encounter issues with a transaction,
                            you can report them from the transaction details page.
                        </p>
                    </div>
                ) : (
                    <div className="disputes-list">
                        {disputes.map((dispute) => (
                            <Link
                                key={dispute.id}
                                to={`/disputes/${dispute.id}`}
                                className="dispute-card card"
                            >
                                <div className="dispute-card-header">
                                    {getStatusIcon(dispute.status)}
                                    <div className="dispute-info">
                                        <h3>{dispute.reason}</h3>
                                        <p className="dispute-book">Re: {dispute.book_title}</p>
                                    </div>
                                    <span className={`badge badge-${dispute.status.toLowerCase()}`}>
                                        {dispute.status}
                                    </span>
                                </div>

                                <div className="dispute-card-body">
                                    <div className="dispute-parties">
                                        <span>You reported <strong>{dispute.reported_name}</strong></span>
                                    </div>
                                    <span className="dispute-date">{formatDate(dispute.created_at)}</span>
                                </div>

                                <div className="dispute-card-arrow">
                                    <ChevronRight size={20} />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Disputes;
