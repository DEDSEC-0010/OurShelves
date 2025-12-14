import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, BookOpen, Users, Shield, ArrowRight, MapPin, Star, Clock } from 'lucide-react';
import './Home.css';

function Home() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="home">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content container">
                    <div className="hero-badge">
                        <span className="hero-badge-icon">📚</span>
                        <span>100% Free • Community-Powered</span>
                    </div>
                    <h1 className="hero-title">
                        Share Books,
                        <span className="hero-title-accent"> Build Community</span>
                    </h1>
                    <p className="hero-description">
                        Discover and share books with your neighbors. Ourshelves connects book lovers
                        in your local area for free lending and exchange — no fees, no shipping, just community.
                    </p>
                    <div className="hero-actions">
                        <Link to="/search" className="btn btn-primary btn-lg">
                            <Search size={20} />
                            Find Books Nearby
                        </Link>
                        {!isAuthenticated && (
                            <Link to="/register" className="btn btn-secondary btn-lg">
                                Join the Community
                                <ArrowRight size={20} />
                            </Link>
                        )}
                    </div>
                    <div className="hero-stats">
                        <div className="hero-stat">
                            <span className="hero-stat-value">1,000+</span>
                            <span className="hero-stat-label">Books Shared</span>
                        </div>
                        <div className="hero-stat">
                            <span className="hero-stat-value">500+</span>
                            <span className="hero-stat-label">Active Members</span>
                        </div>
                        <div className="hero-stat">
                            <span className="hero-stat-value">50+</span>
                            <span className="hero-stat-label">Neighborhoods</span>
                        </div>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="hero-books">
                        <div className="floating-book book-1">📖</div>
                        <div className="floating-book book-2">📚</div>
                        <div className="floating-book book-3">📕</div>
                        <div className="floating-book book-4">📗</div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="features">
                <div className="container">
                    <h2 className="section-title">How It Works</h2>
                    <p className="section-description">
                        Three simple steps to start sharing books with your community
                    </p>

                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">
                                <MapPin size={32} />
                            </div>
                            <h3 className="feature-title">Discover Locally</h3>
                            <p className="feature-description">
                                Find available books within your neighborhood. Search by title, author,
                                or browse what's nearby on the map.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <BookOpen size={32} />
                            </div>
                            <h3 className="feature-title">Request & Share</h3>
                            <p className="feature-description">
                                Send a borrow request to the owner. Once approved, coordinate a
                                convenient pickup time through secure in-app messaging.
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">
                                <Star size={32} />
                            </div>
                            <h3 className="feature-title">Build Trust</h3>
                            <p className="feature-description">
                                Rate your experience after each exchange. Build your reputation
                                and help create a trusted community of book lovers.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Trust Section */}
            <section className="trust">
                <div className="container">
                    <div className="trust-content">
                        <div className="trust-text">
                            <h2>Built on Trust</h2>
                            <p>
                                At Ourshelves, trust is our currency. Our reputation system ensures
                                that reliable members thrive while keeping the community safe.
                            </p>
                            <ul className="trust-features">
                                <li>
                                    <Shield size={20} />
                                    <span>Verified user profiles and ratings</span>
                                </li>
                                <li>
                                    <Users size={20} />
                                    <span>Community-driven accountability</span>
                                </li>
                                <li>
                                    <Clock size={20} />
                                    <span>Transparent transaction history</span>
                                </li>
                            </ul>
                        </div>
                        <div className="trust-visual">
                            <div className="trust-card">
                                <div className="trust-card-header">
                                    <div className="trust-avatar">JD</div>
                                    <div>
                                        <div className="trust-name">Jane Doe</div>
                                        <div className="trust-rating">
                                            <Star size={14} fill="currentColor" />
                                            <span>4.9 • 42 exchanges</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="trust-badges">
                                    <span className="badge badge-success">98% On-Time Returns</span>
                                    <span className="badge badge-info">Top Contributor</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta">
                <div className="container">
                    <div className="cta-content">
                        <h2>Ready to Share?</h2>
                        <p>Join thousands of book lovers in your community today.</p>
                        <div className="cta-actions">
                            {isAuthenticated ? (
                                <Link to="/add-book" className="btn btn-primary btn-lg">
                                    List Your First Book
                                </Link>
                            ) : (
                                <>
                                    <Link to="/register" className="btn btn-primary btn-lg">
                                        Get Started Free
                                    </Link>
                                    <Link to="/search" className="btn btn-secondary btn-lg">
                                        Browse Books
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default Home;
