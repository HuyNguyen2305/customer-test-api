import crypto from 'node:crypto';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UniqueConstraintError } from 'sequelize';

import { ConflictError, UnauthorizedError } from '#configs/error.js';

class AuthService {
  constructor({ authRepository }) {
    this.authRepository = authRepository;
  }

  async register(username, password) {
    const existing = await this.authRepository.findByUsername(username);
    if (existing) {
      throw new ConflictError('Username already taken');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    try {
      const customer = await this.authRepository.createCustomer({ username, passwordHash, isRegistered: true });
      return { id: customer.id, username: customer.username };
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new ConflictError('Username already taken');
      }
      throw error;
    }
  }

  async login(username, password) {
    const customer = await this.authRepository.findByUsername(username);
    if (!customer || !customer.passwordHash) {
      throw new UnauthorizedError('Invalid username or password');
    }

    const isValid = await bcrypt.compare(password, customer.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid username or password');
    }

    const jti = crypto.randomUUID();
    const token = jwt.sign({ customerId: customer.id, username: customer.username, jti }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    return {
      token,
      customer: {
        id: customer.id,
        username: customer.username,
        firstName: customer.firstName,
        lastName: customer.lastName,
      },
    };
  }

  async logout({ jti, customerId, exp }) {
    await this.authRepository.revokeToken({ jti, customerId, expiresAt: new Date(exp * 1000) });
  }

  async changePassword({ customerId, newPassword, jti, exp }) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.authRepository.updatePasswordHash(customerId, passwordHash);
    await this.authRepository.revokeToken({ jti, customerId, expiresAt: new Date(exp * 1000) });
  }
}

export default AuthService;
