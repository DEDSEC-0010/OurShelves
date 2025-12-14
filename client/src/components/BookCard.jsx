import { Link } from 'react-router-dom';
import { Star, MapPin, BookOpen } from 'lucide-react';
import './BookCard.css';

function BookCard({ book }) {
    const conditionColors = {
        New: 'badge-success',
        Good: 'badge-info',
        Acceptable: 'badge-warning',
    };

    return (
        <Link to={`/books/${book.id}`} className="book-card">
            <div className="book-card-cover">
                {book.cover_url ? (
                    <img src={book.cover_url} alt={book.title} />
                ) : (
                    <div className="book-card-placeholder">
                        <BookOpen size={32} />
                    </div>
                )}
                <span className={`badge ${conditionColors[book.condition]} book-card-condition`}>
                    {book.condition}
                </span>
            </div>

            <div className="book-card-content">
                <h3 className="book-card-title">{book.title}</h3>
                <p className="book-card-author">{book.author || 'Unknown Author'}</p>

                <div className="book-card-meta">
                    {book.distance !== undefined && (
                        <span className="book-card-distance">
                            <MapPin size={14} />
                            {book.distance.toFixed(1)} mi
                        </span>
                    )}

                    {book.owner_rating > 0 && (
                        <span className="book-card-rating">
                            <Star size={14} fill="currentColor" />
                            {book.owner_rating.toFixed(1)}
                        </span>
                    )}
                </div>

                <div className="book-card-owner">
                    <span className="book-card-owner-label">From</span>
                    <span className="book-card-owner-name">{book.owner_name}</span>
                </div>
            </div>
        </Link>
    );
}

export default BookCard;
