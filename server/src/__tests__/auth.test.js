import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../index.js';
import db from '../models/database.js';

describe('Auth API', () => {
    const testUser = {
        email: `test${Date.now()}@example.com`,
        password: 'TestPassword123!',
        name: 'Test User',
        latitude: 40.7128,
        longitude: -74.0060,
    };

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send(testUser)
                .expect(201);

            expect(response.body).toHaveProperty('token');
            expect(response.body.user).toHaveProperty('id');
            expect(response.body.user.email).toBe(testUser.email);
            expect(response.body.user.name).toBe(testUser.name);
        });

        it('should reject registration with existing email', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send(testUser)
                .expect(400);

            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toContain('already registered');
        });

        it('should reject registration with invalid email', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({ ...testUser, email: 'invalid-email' })
                .expect(400);

            expect(response.body).toHaveProperty('errors');
        });

        it('should reject registration with short password', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({ ...testUser, email: 'new@example.com', password: '123' })
                .expect(400);

            expect(response.body).toHaveProperty('errors');
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                })
                .expect(200);

            expect(response.body).toHaveProperty('token');
            expect(response.body.user.email).toBe(testUser.email);
        });

        it('should reject login with incorrect password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: 'wrongpassword',
                })
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });

        it('should reject login with non-existent email', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123',
                })
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('POST /api/auth/refresh', () => {
        it('should refresh token with valid token', async () => {
            // First login to get a token
            const loginResponse = await request(app)
                .post('/api/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                });

            const response = await request(app)
                .post('/api/auth/refresh')
                .set('Authorization', `Bearer ${loginResponse.body.token}`)
                .expect(200);

            expect(response.body).toHaveProperty('token');
        });

        it('should reject refresh without token', async () => {
            const response = await request(app)
                .post('/api/auth/refresh')
                .expect(401);

            expect(response.body).toHaveProperty('error');
        });
    });
});
