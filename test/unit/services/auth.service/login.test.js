import { jest } from '@jest/globals';

const bcryptCompareMock = jest.fn();
const jwtSignMock = jest.fn();

jest.unstable_mockModule('bcryptjs', () => ({
  default: { compare: bcryptCompareMock, hash: jest.fn() },
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: { sign: jwtSignMock },
}));

const { default: AuthService } = await import('#service/auth.service.js');
const { UnauthorizedError } = await import('#configs/error.js');

describe('AuthService.login', () => {
  beforeEach(() => {
    bcryptCompareMock.mockReset();
    jwtSignMock.mockReset();
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '1d';
  });

  const customer = {
    id: 'c1',
    username: 'jane.doe',
    firstName: 'Jane',
    lastName: 'Doe',
    passwordHash: 'hashed',
  };

  it('returns a token and customer profile on valid credentials', async () => {
    const service = Object.create(AuthService.prototype);
    service.authRepository = { findByUsername: jest.fn().mockResolvedValue(customer) };
    bcryptCompareMock.mockResolvedValue(true);
    jwtSignMock.mockReturnValue('signed-token');

    const result = await service.login('jane.doe', 'password123');

    expect(service.authRepository.findByUsername).toHaveBeenCalledWith('jane.doe');
    expect(bcryptCompareMock).toHaveBeenCalledWith('password123', 'hashed');
    expect(jwtSignMock).toHaveBeenCalledWith(
      { customerId: 'c1', username: 'jane.doe', jti: expect.any(String) },
      'test-secret',
      { expiresIn: '1d' },
    );
    expect(result).toEqual({
      token: 'signed-token',
      customer: { id: 'c1', username: 'jane.doe', firstName: 'Jane', lastName: 'Doe' },
    });
  });

  it('throws UnauthorizedError when no customer matches the username', async () => {
    const service = Object.create(AuthService.prototype);
    service.authRepository = { findByUsername: jest.fn().mockResolvedValue(null) };

    await expect(service.login('nobody', 'password123')).rejects.toThrow(UnauthorizedError);
    expect(bcryptCompareMock).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedError when the password does not match', async () => {
    const service = Object.create(AuthService.prototype);
    service.authRepository = { findByUsername: jest.fn().mockResolvedValue(customer) };
    bcryptCompareMock.mockResolvedValue(false);

    await expect(service.login('jane.doe', 'wrong')).rejects.toThrow(UnauthorizedError);
    expect(jwtSignMock).not.toHaveBeenCalled();
  });
});
