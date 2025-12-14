import db from '../models/database.js';

/**
 * Calculate a user's reputation score based on multiple factors
 * Score ranges from 0-100
 */
export function calculateReputationScore(userId) {
    // Get user data
    const user = db.prepare(`
    SELECT 
      u.id,
      u.created_at,
      COALESCE(AVG(r.score), 0) as avg_rating,
      COUNT(DISTINCT r.id) as rating_count
    FROM users u
    LEFT JOIN ratings r ON (r.rated_id = u.id)
    WHERE u.id = ?
    GROUP BY u.id
  `).get(userId);

    if (!user) return { score: 0, level: 'New', badge: 'bronze' };

    // Get transaction stats
    const txStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed,
      SUM(CASE WHEN status IN ('Cancelled', 'Rejected') THEN 1 ELSE 0 END) as cancelled
    FROM transactions
    WHERE owner_id = ? OR borrower_id = ?
  `).get(userId, userId);

    // Get dispute stats
    const disputeStats = db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN reported_id = ? THEN 1 ELSE 0 END) as against_user
    FROM disputes
    WHERE reporter_id = ? OR reported_id = ?
  `).get(userId, userId, userId);

    // Calculate component scores (each out of 25 for max 100)

    // 1. Rating Score (0-25) - based on average rating
    const avgRating = user.avg_rating || 0;
    const ratingScore = (avgRating / 5) * 25;

    // 2. Transaction Score (0-25) - based on completion rate and volume
    const totalTx = txStats?.total || 0;
    const completedTx = txStats?.completed || 0;
    const completionRate = totalTx > 0 ? completedTx / totalTx : 0;
    const volumeBonus = Math.min(totalTx / 20, 1); // Max bonus at 20 transactions
    const txScore = (completionRate * 15) + (volumeBonus * 10);

    // 3. Account Age Score (0-25) - longer = better
    const createdAt = new Date(user.created_at);
    const accountAge = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24); // days
    const ageScore = Math.min(accountAge / 180, 1) * 25; // Max at 6 months

    // 4. Trust Score (0-25) - based on dispute history
    const disputesAgainst = disputeStats?.against_user || 0;
    const disputePenalty = Math.min(disputesAgainst * 5, 25); // 5 points per dispute
    const trustScore = Math.max(25 - disputePenalty, 0);

    // Calculate total score
    const totalScore = Math.round(ratingScore + txScore + ageScore + trustScore);

    // Determine level and badge
    let level, badge;
    if (totalScore >= 80) {
        level = 'Trusted Community Member';
        badge = 'gold';
    } else if (totalScore >= 60) {
        level = 'Active Member';
        badge = 'silver';
    } else if (totalScore >= 30) {
        level = 'Member';
        badge = 'bronze';
    } else {
        level = 'New Member';
        badge = 'bronze';
    }

    return {
        score: totalScore,
        level,
        badge,
        breakdown: {
            rating: Math.round(ratingScore),
            transactions: Math.round(txScore),
            accountAge: Math.round(ageScore),
            trust: Math.round(trustScore),
        },
        stats: {
            avgRating: avgRating.toFixed(1),
            ratingCount: user.rating_count,
            completedTransactions: completedTx,
            totalTransactions: totalTx,
            disputesAgainst,
        },
    };
}

/**
 * Get trust badge color based on badge type
 */
export function getBadgeColor(badge) {
    const colors = {
        gold: '#FFD700',
        silver: '#C0C0C0',
        bronze: '#CD7F32',
    };
    return colors[badge] || colors.bronze;
}
