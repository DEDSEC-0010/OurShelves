import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../models/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/disputes
 * Create a new dispute
 */
router.post('/', authenticateToken, [
    body('transaction_id').isInt().withMessage('Transaction ID is required'),
    body('reason').trim().notEmpty().withMessage('Reason is required'),
    body('description').optional().trim(),
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { transaction_id, reason, description, evidence_urls } = req.body;

        // Verify transaction exists and user is part of it
        const transaction = db.prepare(`
      SELECT * FROM transactions 
      WHERE id = ? AND (owner_id = ? OR borrower_id = ?)
    `).get(transaction_id, req.user.id, req.user.id);

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        // Check if dispute already exists for this transaction
        const existingDispute = db.prepare(`
      SELECT id FROM disputes WHERE transaction_id = ? AND status != 'Closed'
    `).get(transaction_id);

        if (existingDispute) {
            return res.status(400).json({ error: 'A dispute already exists for this transaction' });
        }

        // Determine reported user (the other party)
        const reported_id = transaction.owner_id === req.user.id
            ? transaction.borrower_id
            : transaction.owner_id;

        // Create dispute
        const result = db.prepare(`
      INSERT INTO disputes (transaction_id, reporter_id, reported_id, reason, description, evidence_urls)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
            transaction_id,
            req.user.id,
            reported_id,
            reason,
            description || null,
            evidence_urls ? JSON.stringify(evidence_urls) : null
        );

        // Update transaction status to Disputed
        db.prepare(`
      UPDATE transactions SET status = 'Disputed', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(transaction_id);

        const dispute = db.prepare('SELECT * FROM disputes WHERE id = ?').get(result.lastInsertRowid);

        res.status(201).json({
            message: 'Dispute created. Our team will review it shortly.',
            dispute
        });
    } catch (error) {
        console.error('Create dispute error:', error);
        res.status(500).json({ error: 'Failed to create dispute' });
    }
});

/**
 * GET /api/disputes
 * Get user's disputes
 */
router.get('/', authenticateToken, (req, res) => {
    try {
        const disputes = db.prepare(`
      SELECT d.*, 
             t.book_id,
             b.title as book_title,
             reporter.name as reporter_name,
             reported.name as reported_name
      FROM disputes d
      JOIN transactions t ON d.transaction_id = t.id
      JOIN books b ON t.book_id = b.id
      JOIN users reporter ON d.reporter_id = reporter.id
      JOIN users reported ON d.reported_id = reported.id
      WHERE d.reporter_id = ? OR d.reported_id = ?
      ORDER BY d.created_at DESC
    `).all(req.user.id, req.user.id);

        res.json({ disputes });
    } catch (error) {
        console.error('Get disputes error:', error);
        res.status(500).json({ error: 'Failed to get disputes' });
    }
});

/**
 * GET /api/disputes/:id
 * Get dispute details
 */
router.get('/:id', authenticateToken, (req, res) => {
    try {
        const dispute = db.prepare(`
      SELECT d.*, 
             t.book_id, t.status as transaction_status,
             b.title as book_title, b.author as book_author,
             reporter.name as reporter_name,
             reported.name as reported_name
      FROM disputes d
      JOIN transactions t ON d.transaction_id = t.id
      JOIN books b ON t.book_id = b.id
      JOIN users reporter ON d.reporter_id = reporter.id
      JOIN users reported ON d.reported_id = reported.id
      WHERE d.id = ? AND (d.reporter_id = ? OR d.reported_id = ?)
    `).get(req.params.id, req.user.id, req.user.id);

        if (!dispute) {
            return res.status(404).json({ error: 'Dispute not found' });
        }

        // Parse evidence URLs
        if (dispute.evidence_urls) {
            dispute.evidence_urls = JSON.parse(dispute.evidence_urls);
        }

        res.json({ dispute });
    } catch (error) {
        console.error('Get dispute error:', error);
        res.status(500).json({ error: 'Failed to get dispute' });
    }
});

/**
 * PUT /api/disputes/:id/add-evidence
 * Add evidence to a dispute
 */
router.put('/:id/add-evidence', authenticateToken, [
    body('evidence_url').trim().notEmpty().isURL(),
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const dispute = db.prepare(`
      SELECT * FROM disputes WHERE id = ? AND (reporter_id = ? OR reported_id = ?)
    `).get(req.params.id, req.user.id, req.user.id);

        if (!dispute) {
            return res.status(404).json({ error: 'Dispute not found' });
        }

        if (dispute.status !== 'Open') {
            return res.status(400).json({ error: 'Cannot add evidence to a non-open dispute' });
        }

        let evidenceUrls = dispute.evidence_urls ? JSON.parse(dispute.evidence_urls) : [];
        evidenceUrls.push(req.body.evidence_url);

        db.prepare(`
      UPDATE disputes SET evidence_urls = ? WHERE id = ?
    `).run(JSON.stringify(evidenceUrls), req.params.id);

        res.json({ message: 'Evidence added successfully' });
    } catch (error) {
        console.error('Add evidence error:', error);
        res.status(500).json({ error: 'Failed to add evidence' });
    }
});

export default router;
