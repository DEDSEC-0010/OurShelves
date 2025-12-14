import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import db from '../models/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/transactions
 * Request to borrow/exchange a book (creates new transaction)
 */
router.post('/', authenticateToken, [
    body('book_id').isInt().withMessage('Book ID is required'),
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { book_id } = req.body;

        // Get book and verify availability
        const book = db.prepare(`
      SELECT b.*, u.status as owner_status 
      FROM books b 
      JOIN users u ON b.owner_id = u.id 
      WHERE b.id = ?
    `).get(book_id);

        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }

        if (book.status !== 'Available') {
            return res.status(400).json({ error: 'Book is not available for borrowing' });
        }

        if (book.owner_id === req.user.id) {
            return res.status(400).json({ error: 'Cannot borrow your own book' });
        }

        if (book.owner_status !== 'active') {
            return res.status(400).json({ error: 'Book owner is not active' });
        }

        // Check borrower status and limits
        const borrower = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

        if (borrower.status !== 'active') {
            return res.status(403).json({ error: 'Your account is not active' });
        }

        // Check concurrent loan limit (based on reputation)
        const activeLoans = db.prepare(`
      SELECT COUNT(*) as count FROM transactions 
      WHERE borrower_id = ? AND status IN ('Approved', 'PickedUp')
    `).get(req.user.id);

        const maxLoans = borrower.avg_rating >= 4 ? 5 : (borrower.avg_rating >= 3 ? 3 : 2);

        if (activeLoans.count >= maxLoans) {
            return res.status(400).json({
                error: `You have reached your maximum concurrent loans (${maxLoans}). Return some books first.`
            });
        }

        // Check for existing pending request
        const existingRequest = db.prepare(`
      SELECT id FROM transactions 
      WHERE book_id = ? AND borrower_id = ? AND status = 'Requested'
    `).get(book_id, req.user.id);

        if (existingRequest) {
            return res.status(400).json({ error: 'You already have a pending request for this book' });
        }

        // Create transaction
        const result = db.prepare(`
      INSERT INTO transactions (book_id, owner_id, borrower_id, status)
      VALUES (?, ?, ?, 'Requested')
    `).run(book_id, book.owner_id, req.user.id);

        const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(result.lastInsertRowid);

        res.status(201).json({
            message: 'Borrow request submitted. Waiting for owner approval.',
            transaction
        });
    } catch (error) {
        console.error('Create transaction error:', error);
        res.status(500).json({ error: 'Failed to create transaction' });
    }
});

/**
 * PUT /api/transactions/:id/approve
 * Owner approves a borrow request
 */
router.put('/:id/approve', authenticateToken, (req, res) => {
    try {
        const transaction = db.prepare(`
      SELECT t.*, b.title as book_title 
      FROM transactions t 
      JOIN books b ON t.book_id = b.id 
      WHERE t.id = ?
    `).get(req.params.id);

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        if (transaction.owner_id !== req.user.id) {
            return res.status(403).json({ error: 'Only the owner can approve this request' });
        }

        if (transaction.status !== 'Requested') {
            return res.status(400).json({ error: `Cannot approve transaction in ${transaction.status} status` });
        }

        // Update transaction status
        db.prepare(`
      UPDATE transactions 
      SET status = 'Approved', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(req.params.id);

        // Update book status
        db.prepare(`
      UPDATE books SET status = 'PendingPickup', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(transaction.book_id);

        res.json({ message: 'Request approved. You can now coordinate pickup with the borrower.' });
    } catch (error) {
        console.error('Approve transaction error:', error);
        res.status(500).json({ error: 'Failed to approve transaction' });
    }
});

/**
 * PUT /api/transactions/:id/reject
 * Owner rejects a borrow request
 */
router.put('/:id/reject', authenticateToken, [
    body('reason').trim().notEmpty().withMessage('Rejection reason is required'),
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        if (transaction.owner_id !== req.user.id) {
            return res.status(403).json({ error: 'Only the owner can reject this request' });
        }

        if (transaction.status !== 'Requested') {
            return res.status(400).json({ error: `Cannot reject transaction in ${transaction.status} status` });
        }

        db.prepare(`
      UPDATE transactions 
      SET status = 'Rejected', rejection_reason = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(req.body.reason, req.params.id);

        res.json({ message: 'Request rejected' });
    } catch (error) {
        console.error('Reject transaction error:', error);
        res.status(500).json({ error: 'Failed to reject transaction' });
    }
});

/**
 * PUT /api/transactions/:id/confirm-pickup
 * Both parties confirm pickup (both must confirm to move to PickedUp status)
 */
router.put('/:id/confirm-pickup', authenticateToken, (req, res) => {
    try {
        const transaction = db.prepare(`
      SELECT t.*, b.lending_duration_days 
      FROM transactions t 
      JOIN books b ON t.book_id = b.id 
      WHERE t.id = ?
    `).get(req.params.id);

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        if (transaction.status !== 'Approved') {
            return res.status(400).json({ error: 'Transaction must be approved first' });
        }

        const isOwner = transaction.owner_id === req.user.id;
        const isBorrower = transaction.borrower_id === req.user.id;

        if (!isOwner && !isBorrower) {
            return res.status(403).json({ error: 'Not authorized for this transaction' });
        }

        // Update confirmation based on role
        if (isOwner) {
            db.prepare(`
        UPDATE transactions SET pickup_confirmed_owner = 1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(req.params.id);
        } else {
            db.prepare(`
        UPDATE transactions SET pickup_confirmed_borrower = 1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(req.params.id);
        }

        // Check if both confirmed
        const updated = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);

        if (updated.pickup_confirmed_owner && updated.pickup_confirmed_borrower) {
            // Calculate due date
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + transaction.lending_duration_days);

            db.prepare(`
        UPDATE transactions 
        SET status = 'PickedUp', 
            picked_up_at = CURRENT_TIMESTAMP, 
            due_date = ?,
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(dueDate.toISOString(), req.params.id);

            db.prepare(`
        UPDATE books SET status = 'InTransit', updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(transaction.book_id);

            res.json({
                message: 'Pickup confirmed by both parties. Book is now in transit.',
                due_date: dueDate.toISOString()
            });
        } else {
            res.json({
                message: `Pickup confirmed. Waiting for ${isOwner ? 'borrower' : 'owner'} confirmation.`
            });
        }
    } catch (error) {
        console.error('Confirm pickup error:', error);
        res.status(500).json({ error: 'Failed to confirm pickup' });
    }
});

/**
 * PUT /api/transactions/:id/confirm-return
 * Owner confirms book has been returned
 */
router.put('/:id/confirm-return', authenticateToken, (req, res) => {
    try {
        const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        if (transaction.owner_id !== req.user.id) {
            return res.status(403).json({ error: 'Only the owner can confirm return' });
        }

        if (!['PickedUp', 'Overdue'].includes(transaction.status)) {
            return res.status(400).json({ error: 'Book must be picked up first' });
        }

        // Update transaction
        db.prepare(`
      UPDATE transactions 
      SET status = 'Completed', 
          return_confirmed = 1,
          returned_at = CURRENT_TIMESTAMP, 
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(req.params.id);

        // Update book status
        db.prepare(`
      UPDATE books SET status = 'Available', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).run(transaction.book_id);

        // Update completed transactions count for both users
        db.prepare(`
      UPDATE users 
      SET completed_transactions = completed_transactions + 1 
      WHERE id IN (?, ?)
    `).run(transaction.owner_id, transaction.borrower_id);

        res.json({
            message: 'Return confirmed. Transaction completed. Please rate your experience.'
        });
    } catch (error) {
        console.error('Confirm return error:', error);
        res.status(500).json({ error: 'Failed to confirm return' });
    }
});

/**
 * POST /api/transactions/:id/rate
 * Rate the other party after transaction completion
 */
router.post('/:id/rate', authenticateToken, [
    body('score').isInt({ min: 1, max: 5 }).withMessage('Score must be between 1 and 5'),
    body('timeliness').optional().isInt({ min: 1, max: 5 }),
    body('condition_accuracy').optional().isInt({ min: 1, max: 5 }),
    body('communication').optional().isInt({ min: 1, max: 5 }),
    body('comment').optional().trim(),
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const transaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        if (transaction.status !== 'Completed') {
            return res.status(400).json({ error: 'Can only rate completed transactions' });
        }

        const isOwner = transaction.owner_id === req.user.id;
        const isBorrower = transaction.borrower_id === req.user.id;

        if (!isOwner && !isBorrower) {
            return res.status(403).json({ error: 'Not authorized for this transaction' });
        }

        const ratedId = isOwner ? transaction.borrower_id : transaction.owner_id;

        // Check if already rated
        const existingRating = db.prepare(`
      SELECT id FROM ratings WHERE transaction_id = ? AND rater_id = ?
    `).get(req.params.id, req.user.id);

        if (existingRating) {
            return res.status(400).json({ error: 'You have already rated this transaction' });
        }

        const { score, timeliness, condition_accuracy, communication, comment } = req.body;

        // Insert rating
        db.prepare(`
      INSERT INTO ratings (transaction_id, rater_id, rated_id, score, timeliness, condition_accuracy, communication, comment)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.params.id, req.user.id, ratedId, score, timeliness || null, condition_accuracy || null, communication || null, comment || null);

        // Update user's average rating
        const ratings = db.prepare(`
      SELECT AVG(score) as avg, COUNT(*) as count FROM ratings WHERE rated_id = ?
    `).get(ratedId);

        db.prepare(`
      UPDATE users SET avg_rating = ?, total_ratings = ? WHERE id = ?
    `).run(ratings.avg, ratings.count, ratedId);

        res.json({ message: 'Rating submitted successfully' });
    } catch (error) {
        console.error('Rate transaction error:', error);
        res.status(500).json({ error: 'Failed to submit rating' });
    }
});

/**
 * GET /api/transactions
 * Get user's transactions (as owner or borrower)
 */
router.get('/', authenticateToken, (req, res) => {
    try {
        const { role = 'all', status } = req.query;

        let whereClause = '';
        const params = [];

        if (role === 'owner') {
            whereClause = 't.owner_id = ?';
            params.push(req.user.id);
        } else if (role === 'borrower') {
            whereClause = 't.borrower_id = ?';
            params.push(req.user.id);
        } else {
            whereClause = '(t.owner_id = ? OR t.borrower_id = ?)';
            params.push(req.user.id, req.user.id);
        }

        if (status) {
            whereClause += ' AND t.status = ?';
            params.push(status);
        }

        const transactions = db.prepare(`
      SELECT t.*, 
             b.title as book_title, b.author as book_author, b.cover_url as book_cover,
             owner.name as owner_name, owner.avg_rating as owner_rating,
             borrower.name as borrower_name, borrower.avg_rating as borrower_rating
      FROM transactions t
      JOIN books b ON t.book_id = b.id
      JOIN users owner ON t.owner_id = owner.id
      JOIN users borrower ON t.borrower_id = borrower.id
      WHERE ${whereClause}
      ORDER BY t.updated_at DESC
    `).all(...params);

        res.json({ transactions });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ error: 'Failed to get transactions' });
    }
});

/**
 * GET /api/transactions/:id
 * Get single transaction details
 */
router.get('/:id', authenticateToken, (req, res) => {
    try {
        const transaction = db.prepare(`
      SELECT t.*, 
             b.title as book_title, b.author as book_author, b.cover_url as book_cover,
             b.condition as book_condition, b.description as book_description,
             owner.name as owner_name, owner.avg_rating as owner_rating,
             borrower.name as borrower_name, borrower.avg_rating as borrower_rating
      FROM transactions t
      JOIN books b ON t.book_id = b.id
      JOIN users owner ON t.owner_id = owner.id
      JOIN users borrower ON t.borrower_id = borrower.id
      WHERE t.id = ?
    `).get(req.params.id);

        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        if (transaction.owner_id !== req.user.id && transaction.borrower_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to view this transaction' });
        }

        // Get ratings for this transaction
        const ratings = db.prepare(`
      SELECT r.*, u.name as rater_name 
      FROM ratings r 
      JOIN users u ON r.rater_id = u.id 
      WHERE r.transaction_id = ?
    `).all(req.params.id);

        res.json({ transaction, ratings });
    } catch (error) {
        console.error('Get transaction error:', error);
        res.status(500).json({ error: 'Failed to get transaction' });
    }
});

export default router;
