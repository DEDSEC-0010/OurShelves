import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import db from '../models/database.js';

let io;

export function initializeSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: ['http://localhost:5173', 'http://localhost:3000'],
            methods: ['GET', 'POST'],
        },
    });

    // Authentication middleware for socket connections
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;

        if (!token) {
            return next(new Error('Authentication required'));
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ourshelves_jwt_secret');
            socket.userId = decoded.id;
            socket.userEmail = decoded.email;
            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`User ${socket.userId} connected`);

        // Join transaction-specific rooms
        socket.on('join-transaction', (transactionId) => {
            // Verify user is part of this transaction
            const transaction = db.prepare(`
        SELECT * FROM transactions WHERE id = ? AND (owner_id = ? OR borrower_id = ?)
      `).get(transactionId, socket.userId, socket.userId);

            if (transaction) {
                socket.join(`transaction-${transactionId}`);
                console.log(`User ${socket.userId} joined transaction-${transactionId}`);
            }
        });

        // Handle new message
        socket.on('send-message', ({ transactionId, content, messageType = 'text' }) => {
            // Verify user can send to this transaction
            const transaction = db.prepare(`
        SELECT * FROM transactions 
        WHERE id = ? AND (owner_id = ? OR borrower_id = ?)
        AND status IN ('Approved', 'PickedUp', 'Overdue')
      `).get(transactionId, socket.userId, socket.userId);

            if (!transaction) {
                socket.emit('error', { message: 'Cannot send message to this transaction' });
                return;
            }

            // Save message to database
            const result = db.prepare(`
        INSERT INTO messages (transaction_id, sender_id, content, message_type)
        VALUES (?, ?, ?, ?)
      `).run(transactionId, socket.userId, content, messageType);

            // Get the saved message with sender info
            const message = db.prepare(`
        SELECT m.*, u.name as sender_name
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.id = ?
      `).get(result.lastInsertRowid);

            // Broadcast to all users in the transaction room
            io.to(`transaction-${transactionId}`).emit('new-message', message);
        });

        // Typing indicator
        socket.on('typing', ({ transactionId }) => {
            socket.to(`transaction-${transactionId}`).emit('user-typing', {
                userId: socket.userId,
            });
        });

        socket.on('stop-typing', ({ transactionId }) => {
            socket.to(`transaction-${transactionId}`).emit('user-stop-typing', {
                userId: socket.userId,
            });
        });

        // Leave transaction room
        socket.on('leave-transaction', (transactionId) => {
            socket.leave(`transaction-${transactionId}`);
        });

        socket.on('disconnect', () => {
            console.log(`User ${socket.userId} disconnected`);
        });
    });

    return io;
}

export function getIO() {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
}

// Utility to emit notification to specific user
export function emitToUser(userId, event, data) {
    if (io) {
        io.to(`user-${userId}`).emit(event, data);
    }
}
