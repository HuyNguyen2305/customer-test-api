import { requireCustomerId } from '#common/require-customer-id.js';
import { requireTokenClaims } from '#common/require-token-claims.js';
import { BadRequestError } from '#configs/error.js';

const MIN_PASSWORD_LENGTH = 8;

function assertValidPassword(password, confirmPassword) {
  if (typeof password !== 'string' || typeof confirmPassword !== 'string') {
    throw new BadRequestError('Password and confirmPassword are required');
  }
  if (password !== confirmPassword) {
    throw new BadRequestError('Password and confirmPassword must match');
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new BadRequestError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
}

class AuthController {
  constructor({ authService }) {
    this.authService = authService;
  }

  async register(request, reply) {
    const { username, password, confirmPassword } = request.body ?? {};
    if (typeof username !== 'string' || !username) {
      throw new BadRequestError('Username is required');
    }
    assertValidPassword(password, confirmPassword);

    const data = await this.authService.register(username, password);
    reply.send({ success: true, message: 'Registration successful', data });
  }

  async login(request, reply) {
    const { username, password } = request.body ?? {};
    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
      throw new BadRequestError('Username and password are required');
    }

    const data = await this.authService.login(username, password);
    reply.send({ success: true, message: 'Login successful', data });
  }

  async logout(request, reply) {
    const customerId = requireCustomerId();
    const { jti, exp } = requireTokenClaims();
    await this.authService.logout({ jti, customerId, exp });
    reply.send({ success: true, message: 'Logged out successfully', data: null });
  }

  async changePassword(request, reply) {
    const customerId = requireCustomerId();
    const { jti, exp } = requireTokenClaims();
    const { newPassword, confirmPassword } = request.body ?? {};
    assertValidPassword(newPassword, confirmPassword);

    await this.authService.changePassword({ customerId, newPassword, jti, exp });
    reply.send({ success: true, message: 'Password changed successfully', data: null });
  }
}

export default AuthController;
