import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Plus, BookOpen, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import './MyBooks.css';

function MyBooks() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchBooks();
    }, []);

    const fetchBooks = async () => {
        try {
            const data = await api.getMyBooks();
            setBooks(data.books);
        } catch (err) {
            setError('Failed to load your books');
        } finally {
            setLoading(false);
        }
    };

    const toggleAvailability = async (book) => {
        const newStatus = book.status === 'Available' ? 'Unavailable' : 'Available';
        try {
            await api.updateBook(book.id, { status: newStatus });
            setBooks(books.map(b =>
                b.id === book.id ? { ...b, status: newStatus } : b
            ));
        } catch (err) {
            setError('Failed to update book status');
        }
    };

    const deleteBook = async (bookId) => {
        if (!confirm('Are you sure you want to delete this book?')) return;

        try {
            await api.deleteBook(bookId);
            setBooks(books.filter(b => b.id !== bookId));
        } catch (err) {
            setError(err.message || 'Failed to delete book');
        }
    };

    const conditionColors = {
        New: 'badge-success',
        Good: 'badge-info',
        Acceptable: 'badge-warning',
    };

    const statusColors = {
        Available: 'badge-success',
        PendingPickup: 'badge-warning',
        InTransit: 'badge-info',
        Unavailable: 'badge-error',
    };

    if (loading) {
        return (
            <div className="page flex items-center justify-center">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="my-books-page page">
            <div className="container">
                <header className="my-books-header">
                    <div>
                        <h1>My Books</h1>
                        <p>Manage your book listings</p>
                    </div>
                    <Link to="/add-book" className="btn btn-primary">
                        <Plus size={18} />
                        Add Book
                    </Link>
                </header>

                {error && <div className="alert alert-error">{error}</div>}

                {books.length === 0 ? (
                    <div className="empty-state">
                        <BookOpen size={64} className="empty-state-icon" />
                        <h3 className="empty-state-title">No books listed yet</h3>
                        <p className="empty-state-description">
                            Share your books with the community! Add your first book to get started.
                        </p>
                        <Link to="/add-book" className="btn btn-primary mt-4">
                            <Plus size={18} />
                            Add Your First Book
                        </Link>
                    </div>
                ) : (
                    <div className="books-list">
                        {books.map((book) => (
                            <div key={book.id} className="book-list-item card">
                                <div className="book-list-cover">
                                    {book.cover_url ? (
                                        <img src={book.cover_url} alt={book.title} />
                                    ) : (
                                        <div className="book-list-placeholder">
                                            <BookOpen size={24} />
                                        </div>
                                    )}
                                </div>

                                <div className="book-list-info">
                                    <div className="book-list-badges">
                                        <span className={`badge ${conditionColors[book.condition]}`}>
                                            {book.condition}
                                        </span>
                                        <span className={`badge ${statusColors[book.status]}`}>
                                            {book.status}
                                        </span>
                                    </div>
                                    <h3>{book.title}</h3>
                                    <p className="book-list-author">{book.author || 'Unknown Author'}</p>
                                    <p className="book-list-meta">
                                        {book.listing_type} • {book.lending_duration_days} days lending period
                                    </p>
                                </div>

                                <div className="book-list-actions">
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => toggleAvailability(book)}
                                        disabled={book.status === 'InTransit' || book.status === 'PendingPickup'}
                                        title={book.status === 'Available' ? 'Mark Unavailable' : 'Mark Available'}
                                    >
                                        {book.status === 'Available' ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                    <Link to={`/books/${book.id}`} className="btn btn-ghost btn-sm">
                                        <Edit size={16} />
                                    </Link>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => deleteBook(book.id)}
                                        disabled={book.status === 'InTransit' || book.status === 'PendingPickup'}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MyBooks;
