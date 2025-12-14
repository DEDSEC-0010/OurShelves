import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../models/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

/**
 * GET /api/messages/:transactionId
 * Get chat history for a transaction
 */
router.get('/:transactionId', authenticateToken, (req, res) => {
    try {
        const { transactionId } = req.params;

        // Verify user is part of this transaction
        const transaction = db.prepare(`
      SELECT * FROM transactions WHERE id = ? AND (owner_id = ? OR borrower_id = ?)
    `).get(transactionId, req.user.id, req.user.id);

        if (!transaction) {
            return res.status(403).json({ error: 'Not authorized to view these messages' });
        }

        const messages = db.prepare(`
      SELECT m.*, u.name as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.transaction_id = ?
      ORDER BY m.created_at ASC
    `).all(transactionId);

        res.json({ messages });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Failed to get messages' });
    }
});

/**
 * POST /api/messages/:transactionId
 * Send a message (REST fallback if WebSocket unavailable)
 */
router.post('/:transactionId', authenticateToken, [
    body('content').trim().notEmpty().withMessage('Message content is required'),
    body('message_type').optional().isIn(['text', 'image', 'status_update']),
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { transactionId } = req.params;
        const { content, message_type = 'text' } = req.body;

        // Verify user can send to this transaction and it's in valid state
        const transaction = db.prepare(`
      SELECT * FROM transactions 
      WHERE id = ? AND (owner_id = ? OR borrower_id = ?)
      AND status IN ('Approved', 'PickedUp', 'Overdue')
    `).get(transactionId, req.user.id, req.user.id);

        if (!transaction) {
            return res.status(403).json({ error: 'Cannot send message to this transaction' });
        }

        // Save message
        const result = db.prepare(`
      INSERT INTO messages (transaction_id, sender_id, content, message_type)
      VALUES (?, ?, ?, ?)
    `).run(transactionId, req.user.id, content, message_type);

        const message = db.prepare(`
      SELECT m.*, u.name as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = ?
    `).get(result.lastInsertRowid);

        res.status(201).json({ message });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

export default router;
