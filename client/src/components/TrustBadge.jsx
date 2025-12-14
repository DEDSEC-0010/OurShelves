import { Award, Star, Shield } from 'lucide-react';
import './TrustBadge.css';

function TrustBadge({ badge, score, level, size = 'medium', showLabel = true }) {
    const getBadgeIcon = () => {
        switch (badge) {
            case 'gold':
                return <Award className="badge-icon badge-gold" />;
            case 'silver':
                return <Shield className="badge-icon badge-silver" />;
            default:
                return <Star className="badge-icon badge-bronze" />;
        }
    };

    const getScoreClass = () => {
        if (score >= 80) return 'score-excellent';
        if (score >= 60) return 'score-good';
        if (score >= 30) return 'score-average';
        return 'score-new';
    };

    return (
        <div className={`trust-badge trust-badge-${size}`}>
            <div className={`trust-badge-icon ${badge}`}>
                {getBadgeIcon()}
            </div>
            {showLabel && (
                <div className="trust-badge-info">
                    <span className={`trust-score ${getScoreClass()}`}>
                        {score}/100
                    </span>
                    <span className="trust-level">{level}</span>
                </div>
            )}
        </div>
    );
}

export default TrustBadge;
