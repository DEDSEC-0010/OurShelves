import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, Users, MapPin, Shield, ArrowRight, Sparkles } from 'lucide-react';
import PageTransition, { staggerContainer, staggerItem } from '../components/PageTransition';
import './Home.css';

function Home() {
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
        { value: '10K+', label: 'Books Shared' },
        { value: '5K+', label: 'Happy Readers' },
        { value: '500+', label: 'Communities' },
    ];

    return (
        <PageTransition className="home-page">
            {/* Hero Section */}
            <section className="hero">
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

                <div className="hero-container">
                    <motion.div
                        className="hero-content"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <motion.div
                            className="hero-badge"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <Sparkles size={14} />
                            <span>Free Book Sharing Platform</span>
                        </motion.div>

                        <h1 className="hero-title">
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
                            <Link to="/search" className="btn btn-secondary btn-lg">
                                Browse Books
                            </Link>
                        </div>

                        {/* Stats */}
                        <motion.div
                            className="hero-stats"
                            variants={staggerContainer}
                            initial="initial"
                            animate="animate"
                        >
                            {stats.map((stat, idx) => (
                                <motion.div
                                    key={idx}
                                    className="hero-stat"
                                    variants={staggerItem}
                                >
                                    <span className="stat-value">{stat.value}</span>
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
                                whileHover={{ y: -10, rotate: -2 }}
                            >
                                <div className="hero-card-cover" />
                                <div className="hero-card-info">
                                    <span className="hero-card-title">The Great Gatsby</span>
                                    <span className="hero-card-author">F. Scott Fitzgerald</span>
                                </div>
                            </motion.div>
                            <motion.div
                                className="hero-card hero-card-2"
                                whileHover={{ y: -10, rotate: 2 }}
                            >
                                <div className="hero-card-cover" />
                                <div className="hero-card-info">
                                    <span className="hero-card-title">1984</span>
                                    <span className="hero-card-author">George Orwell</span>
                                </div>
                            </motion.div>
                            <motion.div
                                className="hero-card hero-card-3"
                                whileHover={{ y: -10 }}
                            >
                                <div className="hero-card-cover" />
                                <div className="hero-card-info">
                                    <span className="hero-card-title">Pride & Prejudice</span>
                                    <span className="hero-card-author">Jane Austen</span>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
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
                        <h2>How It Works</h2>
                        <p>Simple, free, and community-driven book sharing</p>
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
                                className={`feature-card feature-${feature.color}`}
                                variants={staggerItem}
                                whileHover={{ y: -8, scale: 1.02 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                            >
                                <div className="feature-icon">
                                    <feature.icon size={28} />
                                </div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
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
                        <h2>Ready to Start Sharing?</h2>
                        <p>Join our community of book lovers today. It's completely free!</p>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Link to="/register" className="btn btn-primary btn-lg">
                                Create Free Account
                                <ArrowRight size={18} />
                            </Link>
                        </motion.div>
                    </motion.div>
                </div>
            </section>
        </PageTransition>
    );
}

export default Home;
