import { jest } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { app } from '../../src/app.js';
import { prisma } from '../../src/prisma.js';

// Compliant password satisfying the complex policy (uppercase, lowercase, digit, special char)
const VALID_PASSWORD = 'StrongPass1!';

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
        password: VALID_PASSWORD,
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
        password: '123', // < 6 chars, no complexity
        name: 'A', // < 2 chars
      });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors).toBeDefined();
      expect(Array.isArray(res.body.errors)).toBe(true);
    });

    it('should return 400 Bad Request when password lacks uppercase letter', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'test@gdgoc.dev',
        password: 'nouppercase1!', // no uppercase
        name: 'Test User',
      });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toBe('Validation failed');
      expect(res.body.errors.some((e) => e.field === 'password')).toBe(true);
      expect(res.body.errors[0].message).toMatch(/uppercase/i);
    });

    it('should return 400 Bad Request when password lacks a digit', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'test@gdgoc.dev',
        password: 'NoDigitHere!', // no number
        name: 'Test User',
      });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.errors.some((e) => e.field === 'password')).toBe(true);
    });

    it('should return 400 Bad Request when password lacks a special character', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'test@gdgoc.dev',
        password: 'NoSpecial123', // no special char
        name: 'Test User',
      });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.errors.some((e) => e.field === 'password')).toBe(true);
    });

    it('should return 201 Created when payload uses "username" instead of "name"', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_secret');
      jest.spyOn(prisma.user, 'create').mockResolvedValue({
        id: 'user-uuid-2',
        email: 'newuser@gdgoc.dev',
        name: 'NewUser',
        created_at: new Date('2026-01-01T00:00:00Z'),
      });

      const res = await request(app).post('/api/auth/register').send({
        email: 'newuser@gdgoc.dev',
        password: VALID_PASSWORD,
        username: 'NewUser',
      });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.data.user.email).toBe('newuser@gdgoc.dev');
    });

    it('should return 400 Bad Request when both "name" and "username" are missing', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'noname@gdgoc.dev',
        password: VALID_PASSWORD,
      });

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('fail');
      expect(res.body.message).toBe('Validation failed');
    });

    it('should return 409 Conflict when registering with already existing email', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'existing-id',
        email: 'existing@gdgoc.dev',
      });

      const res = await request(app).post('/api/auth/register').send({
        email: 'existing@gdgoc.dev',
        password: VALID_PASSWORD,
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
        password: VALID_PASSWORD,
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
