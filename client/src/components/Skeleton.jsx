import { motion } from 'framer-motion';
import './Skeleton.css';

// Base skeleton component
export function Skeleton({ width, height, borderRadius = 'var(--radius-md)', className = '' }) {
    return (
        <motion.div
            className={`skeleton ${className}`}
            style={{ width, height, borderRadius }}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
    );
}

// Book card skeleton
export function BookCardSkeleton() {
    return (
        <div className="skeleton-book-card">
            <Skeleton className="skeleton-image" height="200px" borderRadius="var(--radius-lg)" />
            <div className="skeleton-content">
                <Skeleton width="70%" height="20px" />
                <Skeleton width="50%" height="16px" />
                <div className="skeleton-row">
                    <Skeleton width="60px" height="24px" borderRadius="var(--radius-full)" />
                    <Skeleton width="40px" height="16px" />
                </div>
            </div>
        </div>
    );
}

// Transaction card skeleton
export function TransactionSkeleton() {
    return (
        <div className="skeleton-transaction">
            <div className="skeleton-left">
                <Skeleton width="60px" height="80px" borderRadius="var(--radius-md)" />
                <div className="skeleton-info">
                    <Skeleton width="150px" height="18px" />
                    <Skeleton width="100px" height="14px" />
                    <Skeleton width="80px" height="24px" borderRadius="var(--radius-full)" />
                </div>
            </div>
            <Skeleton width="24px" height="24px" borderRadius="var(--radius-full)" />
        </div>
    );
}

// Profile skeleton
export function ProfileSkeleton() {
    return (
        <div className="skeleton-profile">
            <Skeleton width="100px" height="100px" borderRadius="50%" />
            <Skeleton width="180px" height="28px" />
            <Skeleton width="120px" height="20px" />
            <div className="skeleton-stats">
                <Skeleton width="80px" height="60px" borderRadius="var(--radius-lg)" />
                <Skeleton width="80px" height="60px" borderRadius="var(--radius-lg)" />
                <Skeleton width="80px" height="60px" borderRadius="var(--radius-lg)" />
            </div>
        </div>
    );
}

// Text skeleton
export function TextSkeleton({ lines = 3 }) {
    return (
        <div className="skeleton-text">
            {Array.from({ length: lines }).map((_, i) => (
                <Skeleton
                    key={i}
                    width={i === lines - 1 ? '70%' : '100%'}
                    height="16px"
                />
            ))}
        </div>
    );
}

export default Skeleton;
