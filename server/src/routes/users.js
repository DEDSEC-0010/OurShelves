import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../models/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { calculateReputationScore } from '../utils/reputation.js';

const router = Router();

/**
 * GET /api/users/me
 * Get current user profile
 */
router.get('/me', authenticateToken, (req, res) => {
    try {
        const user = db.prepare(`
      SELECT id, email, name, phone, default_latitude, default_longitude, default_address,
             avg_rating, total_ratings, completed_transactions, status, created_at
      FROM users WHERE id = ?
    `).get(req.user.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Add reputation score
        const reputation = calculateReputationScore(req.user.id);

        res.json({ user: { ...user, reputation } });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to get profile' });
    }
});

/**
 * PUT /api/users/me
 * Update current user profile
 */
router.put('/me', authenticateToken, [
    body('name').optional().trim().notEmpty(),
    body('phone').optional().trim(),
    body('latitude').optional().isFloat({ min: -90, max: 90 }),
    body('longitude').optional().isFloat({ min: -180, max: 180 }),
    body('address').optional().trim(),
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, phone, latitude, longitude, address } = req.body;
        const updates = [];
        const values = [];

        if (name !== undefined) {
            updates.push('name = ?');
            values.push(name);
        }
        if (phone !== undefined) {
            updates.push('phone = ?');
            values.push(phone);
        }
        if (latitude !== undefined) {
            updates.push('default_latitude = ?');
            values.push(latitude);
        }
        if (longitude !== undefined) {
            updates.push('default_longitude = ?');
            values.push(longitude);
        }
        if (address !== undefined) {
            updates.push('default_address = ?');
            values.push(address);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(req.user.id);

        db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...values);

        const updatedUser = db.prepare(`
      SELECT id, email, name, phone, default_latitude, default_longitude, default_address,
             avg_rating, total_ratings, completed_transactions, status
      FROM users WHERE id = ?
    `).get(req.user.id);

        res.json({ message: 'Profile updated', user: updatedUser });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

/**
 * GET /api/users/:id
 * Get public profile of a user
 */
router.get('/:id', (req, res) => {
    try {
        const user = db.prepare(`
      SELECT id, name, avg_rating, total_ratings, completed_transactions, created_at
      FROM users WHERE id = ? AND status = 'active'
    `).get(req.params.id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get on-time return percentage
        const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN returned_at <= due_date THEN 1 ELSE 0 END) as on_time
      FROM transactions 
      WHERE borrower_id = ? AND status = 'Completed'
    `).get(req.params.id);

        const onTimePercentage = stats.total > 0
            ? Math.round((stats.on_time / stats.total) * 100)
            : 100;

        // Calculate reputation score
        const reputation = calculateReputationScore(req.params.id);

        res.json({
            user: {
                ...user,
                on_time_return_percentage: onTimePercentage,
                reputation
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

/**
 * GET /api/users/:id/ratings
 * Get ratings for a user
 */
router.get('/:id/ratings', (req, res) => {
    try {
        const ratings = db.prepare(`
      SELECT r.*, u.name as rater_name
      FROM ratings r
      JOIN users u ON r.rater_id = u.id
      WHERE r.rated_id = ?
      ORDER BY r.created_at DESC
      LIMIT 20
    `).all(req.params.id);

        res.json({ ratings });
    } catch (error) {
        console.error('Get ratings error:', error);
        res.status(500).json({ error: 'Failed to get ratings' });
    }
});

export default router;
