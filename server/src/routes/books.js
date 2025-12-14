import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import db from '../models/database.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { encodeGeohash, getGeohashesInRadius, calculateDistance } from '../utils/geohash.js';

const router = Router();

/**
 * GET /api/books
 * Search books with geospatial filtering
 */
router.get('/', optionalAuth, [
    query('q').optional().trim(),
    query('latitude').optional().isFloat({ min: -90, max: 90 }),
    query('longitude').optional().isFloat({ min: -180, max: 180 }),
    query('radius').optional().isFloat({ min: 0.5, max: 100 }),
    query('condition').optional().isIn(['New', 'Good', 'Acceptable']),
    query('listing_type').optional().isIn(['Lend', 'Exchange', 'Both']),
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { q, latitude, longitude, radius = 10, condition, listing_type } = req.query;

        let sqlQuery = `
      SELECT b.*, u.name as owner_name, u.avg_rating as owner_rating, 
             u.completed_transactions as owner_transactions
      FROM books b
      JOIN users u ON b.owner_id = u.id
      WHERE b.status = 'Available' AND u.status = 'active'
    `;
        const params = [];

        // Text search
        if (q) {
            sqlQuery += ` AND (b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)`;
            const searchTerm = `%${q}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        // Condition filter
        if (condition) {
            sqlQuery += ` AND b.condition = ?`;
            params.push(condition);
        }

        // Listing type filter
        if (listing_type) {
            sqlQuery += ` AND (b.listing_type = ? OR b.listing_type = 'Both')`;
            params.push(listing_type);
        }

        // Geospatial filtering using geohash
        if (latitude && longitude) {
            const geohashes = getGeohashesInRadius(parseFloat(latitude), parseFloat(longitude), parseFloat(radius));
            const geohashConditions = geohashes.map(() => `b.geohash LIKE ?`).join(' OR ');
            sqlQuery += ` AND (${geohashConditions})`;
            geohashes.forEach(gh => params.push(`${gh}%`));
        }

        // Exclude user's own books
        if (req.user) {
            sqlQuery += ` AND b.owner_id != ?`;
            params.push(req.user.id);
        }

        sqlQuery += ` ORDER BY b.created_at DESC LIMIT 50`;

        let books = db.prepare(sqlQuery).all(...params);

        // Calculate distances if coordinates provided
        if (latitude && longitude) {
            const userLat = parseFloat(latitude);
            const userLon = parseFloat(longitude);
            const radiusMiles = parseFloat(radius);

            books = books
                .map(book => ({
                    ...book,
                    distance: calculateDistance(userLat, userLon, book.latitude, book.longitude)
                }))
                .filter(book => book.distance <= radiusMiles)
                .sort((a, b) => a.distance - b.distance);
        }

        res.json({ books, count: books.length });
    } catch (error) {
        console.error('Search books error:', error);
        res.status(500).json({ error: 'Failed to search books' });
    }
});

/**
 * GET /api/books/:id
 * Get single book details
 */
router.get('/:id', (req, res) => {
    try {
        const book = db.prepare(`
      SELECT b.*, u.name as owner_name, u.avg_rating as owner_rating,
             u.completed_transactions as owner_transactions, u.id as owner_id
      FROM books b
      JOIN users u ON b.owner_id = u.id
      WHERE b.id = ?
    `).get(req.params.id);

        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }

        res.json({ book });
    } catch (error) {
        console.error('Get book error:', error);
        res.status(500).json({ error: 'Failed to get book' });
    }
});

/**
 * POST /api/books
 * Create a new book listing
 */
router.post('/', authenticateToken, [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('author').optional().trim(),
    body('isbn').optional().trim(),
    body('condition').isIn(['New', 'Good', 'Acceptable']),
    body('listing_type').optional().isIn(['Lend', 'Exchange', 'Both']),
    body('latitude').isFloat({ min: -90, max: 90 }),
    body('longitude').isFloat({ min: -180, max: 180 }),
    body('lending_duration_days').optional().isInt({ min: 1, max: 90 }),
], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const {
            title, author, isbn, publisher, cover_url, description, page_count,
            condition, listing_type = 'Lend', latitude, longitude,
            lending_duration_days = 14, tags
        } = req.body;

        const geohash = encodeGeohash(latitude, longitude);

        const result = db.prepare(`
      INSERT INTO books (
        owner_id, isbn, title, author, publisher, cover_url, description, page_count,
        condition, listing_type, latitude, longitude, geohash, lending_duration_days, tags
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
            req.user.id, isbn || null, title, author || null, publisher || null,
            cover_url || null, description || null, page_count || null,
            condition, listing_type, latitude, longitude, geohash,
            lending_duration_days, tags ? JSON.stringify(tags) : null
        );

        const book = db.prepare('SELECT * FROM books WHERE id = ?').get(result.lastInsertRowid);

        res.status(201).json({ message: 'Book listed successfully', book });
    } catch (error) {
        console.error('Create book error:', error);
        res.status(500).json({ error: 'Failed to create book listing' });
    }
});

/**
 * PUT /api/books/:id
 * Update a book listing
 */
router.put('/:id', authenticateToken, (req, res) => {
    try {
        const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);

        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }

        if (book.owner_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to update this book' });
        }

        if (book.status === 'InTransit') {
            return res.status(400).json({ error: 'Cannot update book while it is in transit' });
        }

        const {
            title, author, isbn, publisher, cover_url, description, page_count,
            condition, listing_type, latitude, longitude, lending_duration_days, tags, status
        } = req.body;

        const updates = [];
        const values = [];

        const fields = { title, author, isbn, publisher, cover_url, description, page_count, condition, listing_type, lending_duration_days };

        for (const [key, value] of Object.entries(fields)) {
            if (value !== undefined) {
                updates.push(`${key} = ?`);
                values.push(value);
            }
        }

        // Handle location update with geohash
        if (latitude !== undefined && longitude !== undefined) {
            updates.push('latitude = ?', 'longitude = ?', 'geohash = ?');
            values.push(latitude, longitude, encodeGeohash(latitude, longitude));
        }

        if (tags !== undefined) {
            updates.push('tags = ?');
            values.push(JSON.stringify(tags));
        }

        // Only allow status change to Available or Unavailable
        if (status !== undefined && ['Available', 'Unavailable'].includes(status)) {
            updates.push('status = ?');
            values.push(status);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No valid fields to update' });
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(req.params.id);

        db.prepare(`UPDATE books SET ${updates.join(', ')} WHERE id = ?`).run(...values);

        const updatedBook = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);
        res.json({ message: 'Book updated', book: updatedBook });
    } catch (error) {
        console.error('Update book error:', error);
        res.status(500).json({ error: 'Failed to update book' });
    }
});

/**
 * DELETE /api/books/:id
 * Delete a book listing
 */
router.delete('/:id', authenticateToken, (req, res) => {
    try {
        const book = db.prepare('SELECT * FROM books WHERE id = ?').get(req.params.id);

        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }

        if (book.owner_id !== req.user.id) {
            return res.status(403).json({ error: 'Not authorized to delete this book' });
        }

        if (book.status === 'InTransit' || book.status === 'PendingPickup') {
            return res.status(400).json({ error: 'Cannot delete book with active transaction' });
        }

        db.prepare('DELETE FROM books WHERE id = ?').run(req.params.id);
        res.json({ message: 'Book deleted successfully' });
    } catch (error) {
        console.error('Delete book error:', error);
        res.status(500).json({ error: 'Failed to delete book' });
    }
});

/**
 * GET /api/books/user/my-listings
 * Get current user's book listings
 */
router.get('/user/my-listings', authenticateToken, (req, res) => {
    try {
        const books = db.prepare(`
      SELECT * FROM books WHERE owner_id = ? ORDER BY created_at DESC
    `).all(req.user.id);

        res.json({ books });
    } catch (error) {
        console.error('Get my listings error:', error);
        res.status(500).json({ error: 'Failed to get listings' });
    }
});

export default router;
