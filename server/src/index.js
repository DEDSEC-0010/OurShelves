import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import booksRoutes from './routes/books.js';
import transactionsRoutes from './routes/transactions.js';
import messagesRoutes from './routes/messages.js';
import disputesRoutes from './routes/disputes.js';
import notificationsRoutes from './routes/notifications.js';
import { initializeDatabase } from './models/database.js';
import { initializeSocket } from './services/socketHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3000;

// Middleware
// CORS Configuration
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];

console.log('Allowed CORS origins:', allowedOrigins);

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            console.log('CORS blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(express.json());

// Initialize database
initializeDatabase();

// Initialize Socket.io
initializeSocket(httpServer);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/disputes', disputesRoutes);
app.use('/api/notifications', notificationsRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production (only if deploying as single service)
// Set SERVE_STATIC=true if you want the backend to serve the frontend
if (process.env.NODE_ENV === 'production' && process.env.SERVE_STATIC === 'true') {
    const clientDist = join(__dirname, '../../..', 'client', 'dist');
    app.use(express.static(clientDist));

    // Handle SPA routing - serve index.html for non-API routes
    app.get('*', (req, res) => {
        res.sendFile(join(clientDist, 'index.html'));
    });
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

httpServer.listen(PORT, () => {
    console.log(`🚀 Ourshelves server running on http://localhost:${PORT}`);
    console.log(`🔌 WebSocket server ready`);
});

export default app;
