import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ArrowRightLeft, BookOpen, Clock, Check, AlertTriangle, X } from 'lucide-react';
import './Transactions.css';

function Transactions() {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');

    useEffect(() => {
        fetchTransactions();
    }, [roleFilter]);

    const fetchTransactions = async () => {
        try {
            const params = roleFilter !== 'all' ? { role: roleFilter } : {};
            const data = await api.getTransactions(params);
            setTransactions(data.transactions);
        } catch (err) {
            console.error('Failed to load transactions');
        } finally {
            setLoading(false);
        }
    };

    const statusConfig = {
        Requested: { icon: Clock, color: 'badge-warning', label: 'Pending Approval' },
        Approved: { icon: Check, color: 'badge-info', label: 'Ready for Pickup' },
        Rejected: { icon: X, color: 'badge-error', label: 'Rejected' },
        PickedUp: { icon: ArrowRightLeft, color: 'badge-info', label: 'In Transit' },
        Overdue: { icon: AlertTriangle, color: 'badge-error', label: 'Overdue' },
        Completed: { icon: Check, color: 'badge-success', label: 'Completed' },
        Disputed: { icon: AlertTriangle, color: 'badge-error', label: 'Disputed' },
        Cancelled: { icon: X, color: 'badge-error', label: 'Cancelled' },
    };

    const filteredTransactions = transactions.filter(t => {
        if (filter === 'all') return true;
        if (filter === 'active') return ['Requested', 'Approved', 'PickedUp'].includes(t.status);
        if (filter === 'completed') return t.status === 'Completed';
        return t.status === filter;
    });

    if (loading) {
        return (
            <div className="page flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="transactions-page page">
            <div className="container">
                <header className="transactions-header">
                    <h1>Transactions</h1>
                    <p>Track your lending and borrowing activity</p>
                </header>

                <div className="transactions-filters">
                    <div className="filter-group">
                        <button
                            className={`filter-btn ${roleFilter === 'all' ? 'active' : ''}`}
                            onClick={() => setRoleFilter('all')}
                        >
                            All
                        </button>
                        <button
                            className={`filter-btn ${roleFilter === 'owner' ? 'active' : ''}`}
                            onClick={() => setRoleFilter('owner')}
                        >
                            As Lender
                        </button>
                        <button
                            className={`filter-btn ${roleFilter === 'borrower' ? 'active' : ''}`}
                            onClick={() => setRoleFilter('borrower')}
                        >
                            As Borrower
                        </button>
                    </div>

                    <select
                        className="form-select filter-select"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="Requested">Pending</option>
                        <option value="Approved">Ready for Pickup</option>
                        <option value="PickedUp">In Transit</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>

                {filteredTransactions.length === 0 ? (
                    <div className="empty-state">
                        <ArrowRightLeft size={64} className="empty-state-icon" />
                        <h3 className="empty-state-title">No transactions yet</h3>
                        <p className="empty-state-description">
                            Your lending and borrowing history will appear here.
                        </p>
                        <Link to="/search" className="btn btn-primary mt-4">
                            Find Books to Borrow
                        </Link>
                    </div>
                ) : (
                    <div className="transactions-list">
                        {filteredTransactions.map((transaction) => {
                            const StatusIcon = statusConfig[transaction.status]?.icon || Clock;
                            const isOwner = transaction.owner_id === user?.id;

                            return (
                                <Link
                                    key={transaction.id}
                                    to={`/transactions/${transaction.id}`}
                                    className="transaction-item card"
                                >
                                    <div className="transaction-book">
                                        {transaction.book_cover ? (
                                            <img src={transaction.book_cover} alt={transaction.book_title} />
                                        ) : (
                                            <div className="transaction-book-placeholder">
                                                <BookOpen size={20} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="transaction-info">
                                        <div className="transaction-top">
                                            <span className={`badge ${statusConfig[transaction.status]?.color}`}>
                                                <StatusIcon size={12} />
                                                {statusConfig[transaction.status]?.label}
                                            </span>
                                            <span className="transaction-role">
                                                {isOwner ? 'Lending' : 'Borrowing'}
                                            </span>
                                        </div>
                                        <h3>{transaction.book_title}</h3>
                                        <p className="transaction-author">{transaction.book_author}</p>
                                        <p className="transaction-party">
                                            {isOwner
                                                ? `To: ${transaction.borrower_name}`
                                                : `From: ${transaction.owner_name}`
                                            }
                                        </p>
                                        {transaction.due_date && ['PickedUp', 'Overdue'].includes(transaction.status) && (
                                            <p className={`transaction-due ${transaction.status === 'Overdue' ? 'overdue' : ''}`}>
                                                Due: {new Date(transaction.due_date).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>

                                    <div className="transaction-arrow">→</div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Transactions;
