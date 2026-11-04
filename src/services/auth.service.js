import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../errors/appError.js';

export const registerUser = async ({ email, password, name, username }) => {
  // Accept either 'name' or 'username' from the request body
  const resolvedName = (name || username || '').trim();
  const normalizedEmail = email.toLowerCase().trim();

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw AppError.conflict('Email is already registered');
  }

  // Hash password with salt rounds 10
  const password_hash = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      password_hash,
      name: resolvedName,
    },
    select: {
      id: true,
      email: true,
      name: true,
      created_at: true,
    },
  });

  return user;
};

export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);
  if (!isPasswordValid) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
};

export default {
  registerUser,
  loginUser,
};

