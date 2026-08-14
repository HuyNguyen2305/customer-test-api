import 'dotenv/config';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';

const token = jwt.sign(
  { customerId: 'c5cd7d8b-c490-4892-962a-d48db09c1b45', username: 'manual-test', jti: crypto.randomUUID() },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN },
);

console.log(token);
