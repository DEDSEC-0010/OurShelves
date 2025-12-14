import { useState } from 'react';
import { api } from '../services/api';
import { AlertTriangle, X } from 'lucide-react';
import './ReportModal.css';

const REPORT_REASONS = [
    'Book not as described',
    'No-show for pickup/return',
    'User unresponsive',
    'Damaged or missing book',
    'Inappropriate behavior',
    'Suspected fraud',
    'Other',
];

function ReportModal({ isOpen, onClose, transactionId, reportedUserId, reportedUserName }) {
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!reason) return;

        setLoading(true);
        setError('');

        try {
            await api.createDispute(transactionId, reason, description);
            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setReason('');
                setDescription('');
            }, 2000);
        } catch (err) {
            setError(err.message || 'Failed to submit report');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (!loading) {
            onClose();
            setError('');
            setReason('');
            setDescription('');
        }
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="report-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={handleClose} disabled={loading}>
                    <X size={20} />
                </button>

                <div className="report-header">
                    <AlertTriangle size={32} className="report-icon" />
                    <h2>Report an Issue</h2>
                    <p>Report a problem with <strong>{reportedUserName}</strong></p>
                </div>

                {success ? (
                    <div className="report-success">
                        <div className="success-checkmark">✓</div>
                        <h3>Report Submitted</h3>
                        <p>We'll review your report and take appropriate action.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div className="alert alert-error mb-4">{error}</div>
                        )}

                        <div className="form-group">
                            <label className="form-label">What's the issue?</label>
                            <select
                                className="form-select"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                required
                            >
                                <option value="">Select a reason</option>
                                {REPORT_REASONS.map((r) => (
                                    <option key={r} value={r}>{r}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                Additional details
                                <span className="form-hint">(optional)</span>
                            </label>
                            <textarea
                                className="form-input"
                                rows="4"
                                placeholder="Provide any additional context that might help us understand the issue..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="report-note">
                            <p>
                                <strong>Note:</strong> Filing a false report may result in action against your account.
                                Please only report genuine issues.
                            </p>
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={handleClose}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary btn-danger"
                                disabled={!reason || loading}
                            >
                                {loading ? 'Submitting...' : 'Submit Report'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

export default ReportModal;
