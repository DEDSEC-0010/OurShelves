import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Search, User, Plus, ArrowRightLeft, LogOut, Menu, X } from 'lucide-react';
import { useState } from 'react';
import NotificationCenter from './NotificationCenter';
import './Header.css';

function Header() {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
        setMobileMenuOpen(false);
    };

    return (
        <header className="header">
            <div className="header-container">
                <Link to="/" className="logo">
                    <BookOpen className="logo-icon" />
                    <span className="logo-text">Ourshelves</span>
                </Link>

                <nav className={`nav ${mobileMenuOpen ? 'nav-open' : ''}`}>
                    <Link to="/search" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                        <Search size={18} />
                        <span>Find Books</span>
                    </Link>

                    {isAuthenticated ? (
                        <>
                            <Link to="/my-books" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                                <BookOpen size={18} />
                                <span>My Books</span>
                            </Link>
                            <Link to="/add-book" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                                <Plus size={18} />
                                <span>Add Book</span>
                            </Link>
                            <Link to="/transactions" className="nav-link" onClick={() => setMobileMenuOpen(false)}>
                                <ArrowRightLeft size={18} />
                                <span>Transactions</span>
                            </Link>
                            <div className="nav-divider" />
                            <NotificationCenter />
                            <Link to="/profile" className="nav-link nav-profile" onClick={() => setMobileMenuOpen(false)}>
                                <User size={18} />
                                <span>{user?.name || 'Profile'}</span>
                            </Link>
                            <button className="nav-link nav-logout" onClick={handleLogout}>
                                <LogOut size={18} />
                                <span>Logout</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="nav-divider" />
                            <Link to="/login" className="btn btn-ghost" onClick={() => setMobileMenuOpen(false)}>
                                Login
                            </Link>
                            <Link to="/register" className="btn btn-primary" onClick={() => setMobileMenuOpen(false)}>
                                Get Started
                            </Link>
                        </>
                    )}
                </nav>

                <button
                    className="mobile-menu-btn"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle menu"
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>
        </header>
    );
}

export default Header;
