import { Router } from 'express';
import db from '../models/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Initialize notifications table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    link TEXT,
    read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id)`);

/**
 * GET /api/notifications
 * Get user's notifications
 */
router.get('/', authenticateToken, (req, res) => {
    try {
        const { limit = 20, unread_only } = req.query;

        let query = `
      SELECT * FROM notifications 
      WHERE user_id = ?
    `;

        if (unread_only === 'true') {
            query += ` AND read = 0`;
        }

        query += ` ORDER BY created_at DESC LIMIT ?`;

        const notifications = db.prepare(query).all(req.user.id, parseInt(limit));

        // Get unread count
        const unreadCount = db.prepare(`
      SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0
    `).get(req.user.id);

        res.json({
            notifications,
            unread_count: unreadCount.count
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ error: 'Failed to get notifications' });
    }
});

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', authenticateToken, (req, res) => {
    try {
        const notification = db.prepare(`
      SELECT * FROM notifications WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }

        db.prepare(`UPDATE notifications SET read = 1 WHERE id = ?`).run(req.params.id);

        res.json({ message: 'Marked as read' });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ error: 'Failed to mark as read' });
    }
});

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', authenticateToken, (req, res) => {
    try {
        db.prepare(`UPDATE notifications SET read = 1 WHERE user_id = ?`).run(req.user.id);
        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
});

/**
 * Utility function to create a notification (for internal use)
 */
export function createNotification(userId, type, title, message, link = null) {
    try {
        db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, type, title, message, link);
    } catch (error) {
        console.error('Create notification error:', error);
    }
}

export default router;
