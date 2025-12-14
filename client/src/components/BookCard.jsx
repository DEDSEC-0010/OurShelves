import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, MapPin, Star, User } from 'lucide-react';
import './BookCard.css';

function BookCard({ book, isLoading = false }) {
    if (isLoading) {
        return <BookCardSkeleton />;
    }

    return (
        <motion.div
            className="book-card"
            whileHover={{ y: -8, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
            <Link to={`/books/${book.id}`} className="book-card-link">
                <div className="book-card-image">
                    {book.cover_url ? (
                        <img src={book.cover_url} alt={book.title} loading="lazy" />
                    ) : (
                        <div className="book-card-placeholder">
                            <BookOpen size={32} />
                        </div>
                    )}
                    <div className="book-card-overlay">
                        <span className="book-card-view">View Details</span>
                    </div>
                    <span className={`book-card-type type-${book.listing_type?.toLowerCase()}`}>
                        {book.listing_type}
                    </span>
                </div>

                <div className="book-card-content">
                    <h3 className="book-card-title">{book.title}</h3>
                    <p className="book-card-author">{book.author}</p>

                    <div className="book-card-meta">
                        <span className={`book-card-condition condition-${book.condition?.toLowerCase()}`}>
                            {book.condition}
                        </span>
                        {book.distance && (
                            <span className="book-card-distance">
                                <MapPin size={12} />
                                {book.distance.toFixed(1)} mi
                            </span>
                        )}
                    </div>

                    {book.owner_name && (
                        <div className="book-card-owner">
                            <div className="owner-avatar">
                                <User size={14} />
                            </div>
                            <span className="owner-name">{book.owner_name}</span>
                            {book.owner_rating && (
                                <span className="owner-rating">
                                    <Star size={12} fill="currentColor" />
                                    {book.owner_rating.toFixed(1)}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </Link>
        </motion.div>
    );
}

function BookCardSkeleton() {
    return (
        <div className="book-card book-card-skeleton">
            <div className="skeleton-image" />
            <div className="skeleton-content">
                <div className="skeleton-line skeleton-title" />
                <div className="skeleton-line skeleton-author" />
                <div className="skeleton-row">
                    <div className="skeleton-badge" />
                    <div className="skeleton-distance" />
                </div>
            </div>
        </div>
    );
}

export default BookCard;
