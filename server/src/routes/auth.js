import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import db from '../models/database.js';
import { generateToken } from '../middleware/auth.js';
import { encodeGeohash } from '../utils/geohash.js';

const router = Router();

// Registration validation rules
const registerValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('latitude').optional().isFloat({ min: -90, max: 90 }),
    body('longitude').optional().isFloat({ min: -180, max: 180 }),
];

// Login validation rules
const loginValidation = [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
];

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', registerValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, name, phone, latitude, longitude, address } = req.body;

        // Check if user already exists
        const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
        if (existingUser) {
            return res.status(409).json({ error: 'Email already registered' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert new user
        const result = db.prepare(`
      INSERT INTO users (email, password_hash, name, phone, default_latitude, default_longitude, default_address)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(email, passwordHash, name, phone || null, latitude || null, longitude || null, address || null);

        const user = {
            id: result.lastInsertRowid,
            email,
            name
        };

        const token = generateToken(user);

        res.status(201).json({
            message: 'Registration successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            },
            token
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

/**
 * POST /api/auth/login
 * Login user
 */
router.post('/login', loginValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find user
        const user = db.prepare(`
      SELECT id, email, name, password_hash, status 
      FROM users WHERE email = ?
    `).get(email);

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Check if user is banned or suspended
        if (user.status === 'banned') {
            return res.status(403).json({ error: 'Your account has been banned' });
        }

        if (user.status === 'suspended') {
            return res.status(403).json({ error: 'Your account is temporarily suspended' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = generateToken(user);

        res.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            },
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

/**
 * POST /api/auth/refresh
 * Refresh authentication token
 */
router.post('/refresh', (req, res) => {
    // For now, just verify the current token and issue a new one
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token required' });
    }

    try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ourshelves_jwt_secret');

        const user = db.prepare('SELECT id, email, name FROM users WHERE id = ?').get(decoded.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const newToken = generateToken(user);
        res.json({ token: newToken });
    } catch (error) {
        return res.status(403).json({ error: 'Invalid token' });
    }
});

export default router;
