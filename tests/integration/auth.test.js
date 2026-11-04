import { jest } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../../src/app.js';
import { prisma } from '../../src/prisma.js';

describe('Integration - Auth Endpoints (/api/auth)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should return 201 Created on valid registration', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_secret');
      jest.spyOn(prisma.user, 'create').mockResolvedValue({
        id: 'user-uuid-1',
        email: 'developer@gdgoc.dev',
        name: 'Developer Test',
        created_at: new Date('2026-01-01T00:00:00Z'),
      });

      const res = await request(app).post('/api/auth/register').send({
        email: 'developer@gdgoc.dev',
        password: 'password123',
        name: 'Developer Test',
      });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.email).toBe('developer@gdgoc.dev');
      expect(res.body.data.user.name).toBe('Developer Test');
      expect(res.body.data.user.password_hash).toBeUndefined();
    });

    it('should return 400 Bad Request when validation fails (invalid email & short password)', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'not-an-email',
        password: '123', // < 6 chars
        name: 'A', // < 2 chars
      });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors).toBeDefined();
      expect(Array.isArray(res.body.errors)).toBe(true);
    });

    it('should return 409 Conflict when registering with already existing email', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'existing-id',
        email: 'existing@gdgoc.dev',
      });

      const res = await request(app).post('/api/auth/register').send({
        email: 'existing@gdgoc.dev',
        password: 'password123',
        name: 'Existing User',
      });

      expect(res.status).toBe(409);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toBe('Email is already registered');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should return 200 OK and JWT token on valid credentials', async () => {
      const mockUser = {
        id: 'user-uuid-1',
        email: 'developer@gdgoc.dev',
        name: 'Developer Test',
        password_hash: '$2a$10$fakehashedpassword',
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const res = await request(app).post('/api/auth/login').send({
        email: 'developer@gdgoc.dev',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe('developer@gdgoc.dev');
    });

    it('should return 401 Unauthorized on wrong credentials', async () => {
      const mockUser = {
        id: 'user-uuid-1',
        email: 'developer@gdgoc.dev',
        password_hash: '$2a$10$fakehashedpassword',
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      const res = await request(app).post('/api/auth/login').send({
        email: 'developer@gdgoc.dev',
        password: 'wrongpassword',
      });

      expect(res.status).toBe(401);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toBe('Invalid email or password');
    });
  });
});

