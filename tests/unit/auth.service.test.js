import { jest } from '@jest/globals';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../src/prisma.js';
import * as authService from '../../src/services/auth.service.js';
import { AppError } from '../../src/errors/appError.js';

describe('Auth Service - Unit Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new user successfully with hashed password', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_secret_pw');
      jest.spyOn(prisma.user, 'create').mockResolvedValue({
        id: 'uuid-1234',
        email: 'developer@gdgoc.dev',
        name: 'Jane Doe',
        created_at: new Date('2026-01-01T00:00:00Z'),
      });

      const result = await authService.registerUser({
        email: 'developer@gdgoc.dev',
        password: 'securePassword123',
        name: 'Jane Doe',
      });

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'developer@gdgoc.dev' },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('securePassword123', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'developer@gdgoc.dev',
          password_hash: 'hashed_secret_pw',
          name: 'Jane Doe',
        },
        select: {
          id: true,
          email: true,
          name: true,
          created_at: true,
        },
      });
      expect(result).toEqual({
        id: 'uuid-1234',
        email: 'developer@gdgoc.dev',
        name: 'Jane Doe',
        created_at: new Date('2026-01-01T00:00:00Z'),
      });
    });

    it('should throw 409 Conflict if email already exists', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        id: 'uuid-existing',
        email: 'duplicate@gdgoc.dev',
      });

      await expect(
        authService.registerUser({
          email: 'duplicate@gdgoc.dev',
          password: 'password123',
          name: 'Existing User',
        })
      ).rejects.toThrow(AppError);

      try {
        await authService.registerUser({
          email: 'duplicate@gdgoc.dev',
          password: 'password123',
          name: 'Existing User',
        });
      } catch (err) {
        expect(err.statusCode).toBe(409);
        expect(err.message).toBe('Email is already registered');
      }
    });
  });

  describe('loginUser', () => {
    it('should authenticate user and return jwt token', async () => {
      const mockUser = {
        id: 'user-id-555',
        email: 'alice@gdgoc.dev',
        name: 'Alice',
        password_hash: 'hashed_pw',
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jest.spyOn(jwt, 'sign').mockReturnValue('mock.jwt.token');

      const result = await authService.loginUser({
        email: 'alice@gdgoc.dev',
        password: 'correctPassword',
      });

      expect(bcrypt.compare).toHaveBeenCalledWith('correctPassword', 'hashed_pw');
      expect(result.token).toBe('mock.jwt.token');
      expect(result.user).toEqual({
        id: 'user-id-555',
        email: 'alice@gdgoc.dev',
        name: 'Alice',
      });
    });

    it('should throw 401 Unauthorized if user not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      await expect(
        authService.loginUser({
          email: 'unknown@gdgoc.dev',
          password: 'anyPassword',
        })
      ).rejects.toThrow(AppError);

      try {
        await authService.loginUser({
          email: 'unknown@gdgoc.dev',
          password: 'anyPassword',
        });
      } catch (err) {
        expect(err.statusCode).toBe(401);
        expect(err.message).toBe('Invalid email or password');
      }
    });

    it('should throw 401 Unauthorized if password does not match', async () => {
      const mockUser = {
        id: 'user-id-555',
        email: 'alice@gdgoc.dev',
        name: 'Alice',
        password_hash: 'hashed_pw',
      };

      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(
        authService.loginUser({
          email: 'alice@gdgoc.dev',
          password: 'wrongPassword',
        })
      ).rejects.toThrow(AppError);

      try {
        await authService.loginUser({
          email: 'alice@gdgoc.dev',
          password: 'wrongPassword',
        });
      } catch (err) {
        expect(err.statusCode).toBe(401);
      }
    });
  });
});

