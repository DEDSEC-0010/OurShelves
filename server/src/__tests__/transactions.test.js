import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../index.js';
import db from '../models/database.js';

describe('Transactions API', () => {
    let ownerToken, borrowerToken;
    let ownerId, borrowerId;
    let testBookId;
    let transactionId;

    beforeAll(async () => {
        // Create owner user
        const ownerResponse = await request(app)
            .post('/api/auth/register')
            .send({
                email: `owner${Date.now()}@example.com`,
                password: 'TestPassword123!',
                name: 'Book Owner',
                latitude: 40.7128,
                longitude: -74.0060,
            });
        ownerToken = ownerResponse.body.token;
        ownerId = ownerResponse.body.user.id;

        // Create borrower user
        const borrowerResponse = await request(app)
            .post('/api/auth/register')
            .send({
                email: `borrower${Date.now()}@example.com`,
                password: 'TestPassword123!',
                name: 'Book Borrower',
                latitude: 40.7128,
                longitude: -74.0060,
            });
        borrowerToken = borrowerResponse.body.token;
        borrowerId = borrowerResponse.body.user.id;

        // Create a book as owner
        const bookResponse = await request(app)
            .post('/api/books')
            .set('Authorization', `Bearer ${ownerToken}`)
            .send({
                title: 'Transaction Test Book',
                author: 'Test Author',
                condition: 'Good',
                listing_type: 'Lend',
                latitude: 40.7128,
                longitude: -74.0060,
            });
        testBookId = bookResponse.body.book.id;
    });

    describe('POST /api/transactions', () => {
        it('should create a transaction request', async () => {
            const response = await request(app)
                .post('/api/transactions')
                .set('Authorization', `Bearer ${borrowerToken}`)
                .send({ book_id: testBookId })
                .expect(201);

            expect(response.body.transaction).toHaveProperty('id');
            expect(response.body.transaction.status).toBe('Requested');
            expect(response.body.transaction.borrower_id).toBe(borrowerId);
            transactionId = response.body.transaction.id;
        });

        it('should not allow owner to request their own book', async () => {
            const response = await request(app)
                .post('/api/transactions')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({ book_id: testBookId })
                .expect(400);

            expect(response.body.error).toContain('own book');
        });

        it('should not allow duplicate pending requests', async () => {
            const response = await request(app)
                .post('/api/transactions')
                .set('Authorization', `Bearer ${borrowerToken}`)
                .send({ book_id: testBookId })
                .expect(400);

            expect(response.body.error).toContain('pending');
        });
    });

    describe('PUT /api/transactions/:id/approve', () => {
        it('should allow owner to approve request', async () => {
            const response = await request(app)
                .put(`/api/transactions/${transactionId}/approve`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .expect(200);

            expect(response.body.transaction.status).toBe('Approved');
        });

        it('should not allow borrower to approve', async () => {
            // First create a new request
            const newBook = await request(app)
                .post('/api/books')
                .set('Authorization', `Bearer ${ownerToken}`)
                .send({
                    title: 'Another Book',
                    author: 'Author',
                    condition: 'Good',
                    listing_type: 'Lend',
                    latitude: 40.7128,
                    longitude: -74.0060,
                });

            const newTx = await request(app)
                .post('/api/transactions')
                .set('Authorization', `Bearer ${borrowerToken}`)
                .send({ book_id: newBook.body.book.id });

            await request(app)
                .put(`/api/transactions/${newTx.body.transaction.id}/approve`)
                .set('Authorization', `Bearer ${borrowerToken}`)
                .expect(403);
        });
    });

    describe('PUT /api/transactions/:id/confirm-pickup', () => {
        it('should allow parties to confirm pickup', async () => {
            // Owner confirms
            await request(app)
                .put(`/api/transactions/${transactionId}/confirm-pickup`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .expect(200);

            // Borrower confirms - should transition to PickedUp
            const response = await request(app)
                .put(`/api/transactions/${transactionId}/confirm-pickup`)
                .set('Authorization', `Bearer ${borrowerToken}`)
                .expect(200);

            expect(response.body.transaction.status).toBe('PickedUp');
        });
    });

    describe('PUT /api/transactions/:id/confirm-return', () => {
        it('should allow owner to confirm return', async () => {
            const response = await request(app)
                .put(`/api/transactions/${transactionId}/confirm-return`)
                .set('Authorization', `Bearer ${ownerToken}`)
                .expect(200);

            expect(response.body.transaction.status).toBe('Completed');
        });
    });

    describe('POST /api/transactions/:id/rate', () => {
        it('should allow parties to rate after completion', async () => {
            const response = await request(app)
                .post(`/api/transactions/${transactionId}/rate`)
                .set('Authorization', `Bearer ${borrowerToken}`)
                .send({
                    score: 5,
                    comment: 'Great lender!',
                })
                .expect(201);

            expect(response.body).toHaveProperty('message');
        });

        it('should not allow rating twice', async () => {
            await request(app)
                .post(`/api/transactions/${transactionId}/rate`)
                .set('Authorization', `Bearer ${borrowerToken}`)
                .send({
                    score: 5,
                    comment: 'Trying again',
                })
                .expect(400);
        });
    });

    describe('GET /api/transactions', () => {
        it('should get user transactions', async () => {
            const response = await request(app)
                .get('/api/transactions')
                .set('Authorization', `Bearer ${borrowerToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('transactions');
            expect(Array.isArray(response.body.transactions)).toBe(true);
        });

        it('should filter by role', async () => {
            const response = await request(app)
                .get('/api/transactions')
                .set('Authorization', `Bearer ${ownerToken}`)
                .query({ role: 'owner' })
                .expect(200);

            expect(response.body.transactions.every(t => t.owner_id === ownerId)).toBe(true);
        });
    });
});
