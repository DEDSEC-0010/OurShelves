import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, Users, MapPin, Shield, ArrowRight, Sparkles, Star, Heart, Quote } from 'lucide-react';
import PageTransition, { staggerContainer, staggerItem } from '../components/PageTransition';
import heroBg from '../assets/hero-bg.png';
import coverGatsby from '../assets/cover-gatsby.png';
import cover1984 from '../assets/cover-1984.png';
import coverPride from '../assets/cover-pride.png';
import './Home.css';

// Real book covers from Open Library
const BOOK_COVERS = {
    gatsby: coverGatsby,
    orwell: cover1984,
    austen: coverPride,
};

function Home() {
    const { scrollYProgress } = useScroll();
    const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
    const [statsAnimated, setStatsAnimated] = useState(false);

    const features = [
        {
            icon: BookOpen,
            title: 'Share Your Books',
            description: 'List books you\'re willing to lend or exchange with your neighbors.',
            color: 'primary',
        },
        {
            icon: MapPin,
            title: 'Discover Nearby',
            description: 'Find books available in your neighborhood using our interactive map.',
            color: 'accent',
        },
        {
            icon: Users,
            title: 'Build Community',
            description: 'Connect with fellow book lovers and build lasting relationships.',
            color: 'secondary',
        },
        {
            icon: Shield,
            title: 'Trust & Safety',
            description: 'Our reputation system ensures safe and reliable exchanges.',
            color: 'success',
        },
    ];

    const stats = [
        { value: 10000, suffix: '+', label: 'Books Shared' },
        { value: 5000, suffix: '+', label: 'Happy Readers' },
        { value: 500, suffix: '+', label: 'Communities' },
    ];

    const testimonials = [
        {
            quote: "Found my favorite childhood book from a neighbor. This platform is magical!",
            author: "Sarah M.",
            role: "Book Lover",
            rating: 5
        },
        {
            quote: "I've shared over 50 books and made wonderful friends in my community.",
            author: "James K.",
            role: "Community Member",
            rating: 5
        },
        {
            quote: "Simple, free, and it actually works. Love the trust system!",
            author: "Emily R.",
            role: "New Member",
            rating: 5
        }
    ];

    return (
        <PageTransition className="home-page mesh-bg">
            {/* Hero Section */}
            <section className="hero" style={{ '--hero-bg': `url(${heroBg})` }}>
                {/* Animated background orbs */}
                <div className="hero-orbs">
                    <motion.div
                        className="orb orb-1"
                        animate={{
                            x: [0, 30, 0],
                            y: [0, -20, 0],
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                    <motion.div
                        className="orb orb-2"
                        animate={{
                            x: [0, -20, 0],
                            y: [0, 30, 0],
                        }}
                        transition={{
                            duration: 10,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                    <motion.div
                        className="orb orb-3"
                        animate={{
                            x: [0, 15, 0],
                            y: [0, 15, 0],
                        }}
                        transition={{
                            duration: 6,
                            repeat: Infinity,
                            ease: 'easeInOut',
                        }}
                    />
                </div>

                {/* Decorative floating elements */}
                <div className="hero-decorations">
                    <motion.div
                        className="floating-shape shape-1"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    />
                    <motion.div
                        className="floating-shape shape-2"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
                    />
                </div>

                <div className="hero-container">
                    <motion.div
                        className="hero-content"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <motion.div
                            className="hero-badge glass"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            whileHover={{ scale: 1.05 }}
                        >
                            <Sparkles size={14} />
                            <span>Free Book Sharing Platform</span>
                        </motion.div>

                        <h1 className="hero-title font-display">
                            Share Books,
                            <span className="gradient-text"> Build Community</span>
                        </h1>

                        <p className="hero-description">
                            Join thousands of book lovers sharing their favorite reads with neighbors.
                            Lend, borrow, and discover books in your community — all for free.
                        </p>

                        <div className="hero-actions">
                            <motion.div
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Link to="/register" className="btn btn-primary btn-lg hero-cta">
                                    Start Sharing
                                    <ArrowRight size={18} />
                                </Link>
                            </motion.div>
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Link to="/search" className="btn btn-secondary btn-lg glass">
                                    Browse Books
                                </Link>
                            </motion.div>
                        </div>

                        {/* Animated Stats */}
                        <motion.div
                            className="hero-stats"
                            variants={staggerContainer}
                            initial="initial"
                            whileInView="animate"
                            viewport={{ once: true }}
                            onViewportEnter={() => setStatsAnimated(true)}
                        >
                            {stats.map((stat, idx) => (
                                <motion.div
                                    key={idx}
                                    className="hero-stat"
                                    variants={staggerItem}
                                >
                                    <span className="stat-value">
                                        <AnimatedCounter
                                            value={stat.value}
                                            suffix={stat.suffix}
                                            animate={statsAnimated}
                                        />
                                    </span>
                                    <span className="stat-label">{stat.label}</span>
                                </motion.div>
                            ))}
                        </motion.div>
                    </motion.div>

                    <motion.div
                        className="hero-visual"
                        initial={{ opacity: 0, scale: 0.9, rotateY: -10 }}
                        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        <div className="hero-card-stack">
                            <motion.div
                                className="hero-card hero-card-1"
                                whileHover={{ y: -15, rotate: -6, scale: 1.05 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                            >
                                <div className="hero-card-cover">
                                    <img src={BOOK_COVERS.gatsby} alt="The Great Gatsby" />
                                </div>
                                <div className="hero-card-info">
                                    <span className="hero-card-title">The Great Gatsby</span>
                                    <span className="hero-card-author">F. Scott Fitzgerald</span>
                                </div>
                                <div className="hero-card-glow"></div>
                            </motion.div>
                            <motion.div
                                className="hero-card hero-card-2"
                                whileHover={{ y: -15, rotate: 6, scale: 1.05 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                            >
                                <div className="hero-card-cover">
                                    <img src={BOOK_COVERS.orwell} alt="1984" />
                                </div>
                                <div className="hero-card-info">
                                    <span className="hero-card-title">1984</span>
                                    <span className="hero-card-author">George Orwell</span>
                                </div>
                                <div className="hero-card-glow"></div>
                            </motion.div>
                            <motion.div
                                className="hero-card hero-card-3"
                                whileHover={{ y: -15, scale: 1.05 }}
                                animate={{ y: [0, -8, 0] }}
                                transition={{
                                    y: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
                                    hover: { type: 'spring', stiffness: 300 }
                                }}
                            >
                                <div className="hero-card-cover">
                                    <img src={BOOK_COVERS.austen} alt="Pride and Prejudice" />
                                </div>
                                <div className="hero-card-info">
                                    <span className="hero-card-title">Pride & Prejudice</span>
                                    <span className="hero-card-author">Jane Austen</span>
                                </div>
                                <div className="hero-card-glow"></div>
                            </motion.div>
                        </div>

                        {/* Floating hearts decoration */}
                        <motion.div
                            className="floating-heart heart-1"
                            animate={{ y: [0, -10, 0], scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            <Heart size={20} fill="currentColor" />
                        </motion.div>
                        <motion.div
                            className="floating-heart heart-2"
                            animate={{ y: [0, -8, 0], scale: [1, 1.15, 1] }}
                            transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                        >
                            <Heart size={16} fill="currentColor" />
                        </motion.div>
                    </motion.div>
                </div>

                {/* Scroll indicator */}
                <motion.div
                    className="scroll-indicator"
                    style={{ opacity: heroOpacity }}
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <div className="scroll-mouse">
                        <div className="scroll-wheel"></div>
                    </div>
                    <span>Scroll to explore</span>
                </motion.div>
            </section>

            {/* Features Section */}
            <section className="features-section">
                <div className="container">
                    <motion.div
                        className="section-header"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <span className="section-badge">How It Works</span>
                        <h2 className="font-display">Simple, Free & Community-Driven</h2>
                        <p>Share books with your neighbors in just a few easy steps</p>
                    </motion.div>

                    <motion.div
                        className="features-grid"
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                    >
                        {features.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                className={`feature-card feature-${feature.color} glass-strong`}
                                variants={staggerItem}
                                whileHover={{ y: -8, scale: 1.02 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                            >
                                <div className="feature-icon">
                                    <feature.icon size={28} />
                                </div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                                <div className="feature-glow"></div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="testimonials-section">
                <div className="container">
                    <motion.div
                        className="section-header"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <span className="section-badge">Testimonials</span>
                        <h2 className="font-display">Loved by Book Lovers</h2>
                        <p>See what our community members have to say</p>
                    </motion.div>

                    <motion.div
                        className="testimonials-grid"
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                    >
                        {testimonials.map((testimonial, idx) => (
                            <motion.div
                                key={idx}
                                className="testimonial-card glass-strong"
                                variants={staggerItem}
                                whileHover={{ y: -5 }}
                            >
                                <Quote className="quote-icon" size={32} />
                                <p className="testimonial-quote">{testimonial.quote}</p>
                                <div className="testimonial-rating">
                                    {[...Array(testimonial.rating)].map((_, i) => (
                                        <Star key={i} size={14} fill="currentColor" />
                                    ))}
                                </div>
                                <div className="testimonial-author">
                                    <div className="author-avatar">
                                        {testimonial.author.charAt(0)}
                                    </div>
                                    <div className="author-info">
                                        <span className="author-name">{testimonial.author}</span>
                                        <span className="author-role">{testimonial.role}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="cta-section">
                <div className="container">
                    <motion.div
                        className="cta-card"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="cta-content">
                            <motion.div
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 4, repeat: Infinity }}
                            >
                                <BookOpen size={48} className="cta-icon" />
                            </motion.div>
                            <h2 className="font-display">Ready to Start Sharing?</h2>
                            <p>Join our community of book lovers today. It's completely free!</p>
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Link to="/register" className="btn btn-accent btn-lg cta-button">
                                    Create Free Account
                                    <ArrowRight size={18} />
                                </Link>
                            </motion.div>
                        </div>
                        <div className="cta-decoration">
                            <div className="cta-circle cta-circle-1"></div>
                            <div className="cta-circle cta-circle-2"></div>
                            <div className="cta-circle cta-circle-3"></div>
                        </div>
                    </motion.div>
                </div>
            </section>
        </PageTransition>
    );
}

// Animated counter component for stats
function AnimatedCounter({ value, suffix = '', animate }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        if (!animate) return;

        const duration = 2000;
        const steps = 60;
        const stepValue = value / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += stepValue;
            if (current >= value) {
                setCount(value);
                clearInterval(timer);
            } else {
                setCount(Math.floor(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [value, animate]);

    return <>{count.toLocaleString()}{suffix}</>;
}

export default Home;
