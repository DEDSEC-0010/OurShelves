import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Search, User, Plus, ArrowRightLeft, LogOut, Menu, X, AlertTriangle } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import ThemeToggle from './ThemeToggle';
import logoImg from '../assets/logo.png';
import './Header.css';

function Header() {
    const { isAuthenticated, user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const navLinks = [
        { to: '/search', icon: Search, label: 'Find Books' },
    ];

    const authLinks = [
        { to: '/my-books', icon: BookOpen, label: 'My Books' },
        { to: '/add-book', icon: Plus, label: 'Add Book' },
        { to: '/transactions', icon: ArrowRightLeft, label: 'Transactions' },
        { to: '/disputes', icon: AlertTriangle, label: 'Disputes' },
    ];

    return (
        <motion.header
            className={`header ${scrolled ? 'header-scrolled' : ''}`}
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        >
            <div className="header-container">
                <Link to="/" className="logo">
                    <motion.div
                        className="logo-icon-wrapper"
                        whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 0.4 }}
                    >
                        <img src={logoImg} alt="Ourshelves" className="logo-img" />
                    </motion.div>
                    <span className="logo-text">Ourshelves</span>
                </Link>

                <nav className={`nav ${mobileMenuOpen ? 'nav-open' : ''}`}>
                    {navLinks.map((link) => (
                        <NavLink key={link.to} {...link} currentPath={location.pathname} />
                    ))}

                    {isAuthenticated ? (
                        <>
                            {authLinks.map((link) => (
                                <NavLink key={link.to} {...link} currentPath={location.pathname} />
                            ))}
                            <div className="nav-divider" />
                            <NotificationCenter />
                            <NavLink to="/profile" icon={User} label={user?.name || 'Profile'} currentPath={location.pathname} />
                            <motion.button
                                className="nav-link nav-logout"
                                onClick={handleLogout}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <LogOut size={18} />
                                <span>Logout</span>
                            </motion.button>
                        </>
                    ) : (
                        <>
                            <div className="nav-divider" />
                            <Link to="/login" className="btn btn-ghost">
                                Login
                            </Link>
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Link to="/register" className="btn btn-primary">
                                    Get Started
                                </Link>
                            </motion.div>
                        </>
                    )}

                    <div className="nav-divider" />
                    <ThemeToggle />
                </nav>

                <div className="header-mobile-actions">
                    <ThemeToggle />
                    <motion.button
                        className="mobile-menu-btn"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle menu"
                        whileTap={{ scale: 0.9 }}
                    >
                        <AnimatePresence mode="wait">
                            {mobileMenuOpen ? (
                                <motion.div
                                    key="close"
                                    initial={{ rotate: -90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: 90, opacity: 0 }}
                                >
                                    <X size={24} />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="menu"
                                    initial={{ rotate: 90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: -90, opacity: 0 }}
                                >
                                    <Menu size={24} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                </div>
            </div>
        </motion.header>
    );
}

function NavLink({ to, icon: Icon, label, currentPath }) {
    const isActive = currentPath === to;

    return (
        <Link to={to} className={`nav-link ${isActive ? 'nav-link-active' : ''}`}>
            <Icon size={18} />
            <span>{label}</span>
            {isActive && (
                <motion.div
                    className="nav-link-indicator"
                    layoutId="nav-indicator"
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                />
            )}
        </Link>
    );
}

export default Header;
