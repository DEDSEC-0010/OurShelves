import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './ThemeToggle.css';

function ThemeToggle() {
    const { isDark, toggleTheme } = useTheme();

    return (
        <motion.button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <motion.div
                className="theme-toggle-track"
                animate={{ backgroundColor: isDark ? '#374151' : '#FEF3C7' }}
            >
                <motion.div
                    className="theme-toggle-thumb"
                    animate={{ x: isDark ? 22 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                >
                    {isDark ? (
                        <Moon size={14} className="theme-icon moon" />
                    ) : (
                        <Sun size={14} className="theme-icon sun" />
                    )}
                </motion.div>

                {/* Background stars/sun rays */}
                <motion.div
                    className="theme-decoration"
                    animate={{ opacity: isDark ? 1 : 0 }}
                >
                    <span className="star star-1" />
                    <span className="star star-2" />
                    <span className="star star-3" />
                </motion.div>
            </motion.div>
        </motion.button>
    );
}

export default ThemeToggle;
