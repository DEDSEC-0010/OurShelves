import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../index.js';
import db from '../models/database.js';

describe('Books API', () => {
    let authToken;
    let testUserId;
    let testBookId;

    beforeAll(async () => {
        // Create a test user and get auth token
        const email = `bookstest${Date.now()}@example.com`;
        const response = await request(app)
            .post('/api/auth/register')
            .send({
                email,
                password: 'TestPassword123!',
                name: 'Books Test User',
                latitude: 40.7128,
                longitude: -74.0060,
            });

        authToken = response.body.token;
        testUserId = response.body.user.id;
    });

    describe('POST /api/books', () => {
        it('should create a new book listing', async () => {
            const response = await request(app)
                .post('/api/books')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Test Book',
                    author: 'Test Author',
                    isbn: '9780141439556',
                    condition: 'Good',
                    listing_type: 'Lend',
                    latitude: 40.7128,
                    longitude: -74.0060,
                })
                .expect(201);

            expect(response.body.book).toHaveProperty('id');
            expect(response.body.book.title).toBe('Test Book');
            testBookId = response.body.book.id;
        });

        it('should reject creating book without auth', async () => {
            const response = await request(app)
                .post('/api/books')
                .send({
                    title: 'Test Book',
                    author: 'Test Author',
                    condition: 'Good',
                    listing_type: 'Lend',
                })
                .expect(401);
        });

        it('should reject book with missing required fields', async () => {
            const response = await request(app)
                .post('/api/books')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Test Book',
                    // missing other fields
                })
                .expect(400);

            expect(response.body).toHaveProperty('errors');
        });
    });

    describe('GET /api/books', () => {
        it('should search books by location', async () => {
            const response = await request(app)
                .get('/api/books')
                .query({
                    latitude: 40.7128,
                    longitude: -74.0060,
                    radius: 10,
                })
                .expect(200);

            expect(response.body).toHaveProperty('books');
            expect(Array.isArray(response.body.books)).toBe(true);
        });

        it('should filter books by condition', async () => {
            const response = await request(app)
                .get('/api/books')
                .query({
                    latitude: 40.7128,
                    longitude: -74.0060,
                    radius: 10,
                    condition: 'Good',
                })
                .expect(200);

            expect(response.body.books.every(b => b.condition === 'Good')).toBe(true);
        });

        it('should search books by title/author text', async () => {
            const response = await request(app)
                .get('/api/books')
                .query({
                    latitude: 40.7128,
                    longitude: -74.0060,
                    radius: 10,
                    q: 'Test',
                })
                .expect(200);

            expect(response.body).toHaveProperty('books');
        });
    });

    describe('GET /api/books/:id', () => {
        it('should get a specific book by ID', async () => {
            const response = await request(app)
                .get(`/api/books/${testBookId}`)
                .expect(200);

            expect(response.body.book.id).toBe(testBookId);
            expect(response.body.book.title).toBe('Test Book');
        });

        it('should return 404 for non-existent book', async () => {
            const response = await request(app)
                .get('/api/books/99999')
                .expect(404);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('PUT /api/books/:id', () => {
        it('should update a book', async () => {
            const response = await request(app)
                .put(`/api/books/${testBookId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'Updated Test Book',
                })
                .expect(200);

            expect(response.body.book.title).toBe('Updated Test Book');
        });

        it('should not update book without auth', async () => {
            await request(app)
                .put(`/api/books/${testBookId}`)
                .send({ title: 'Unauthorized Update' })
                .expect(401);
        });
    });

    describe('DELETE /api/books/:id', () => {
        it('should delete a book', async () => {
            const response = await request(app)
                .delete(`/api/books/${testBookId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('message');
        });

        it('should return 404 when deleting non-existent book', async () => {
            await request(app)
                .delete(`/api/books/${testBookId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
    });
});
