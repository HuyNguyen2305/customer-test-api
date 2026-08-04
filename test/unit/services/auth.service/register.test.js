import { jest } from '@jest/globals';

const bcryptHashMock = jest.fn();

jest.unstable_mockModule('bcryptjs', () => ({
  default: { hash: bcryptHashMock, compare: jest.fn() },
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: { sign: jest.fn() },
}));

const { default: AuthService } = await import('#service/auth.service.js');
const { ConflictError } = await import('#configs/error.js');
const { UniqueConstraintError } = await import('sequelize');

describe('AuthService.register', () => {
  beforeEach(() => bcryptHashMock.mockReset());

  it('creates a customer with a hashed password when the username is free', async () => {
    const service = Object.create(AuthService.prototype);
    service.authRepository = {
      findByUsername: jest.fn().mockResolvedValue(null),
      createCustomer: jest.fn().mockResolvedValue({ id: 'c1', username: 'jane.doe' }),
    };
    bcryptHashMock.mockResolvedValue('hashed');

    const result = await service.register('jane.doe', 'password123');

    expect(service.authRepository.findByUsername).toHaveBeenCalledWith('jane.doe');
    expect(bcryptHashMock).toHaveBeenCalledWith('password123', 10);
    expect(service.authRepository.createCustomer).toHaveBeenCalledWith({
      username: 'jane.doe',
      passwordHash: 'hashed',
      isRegistered: true,
    });
    expect(result).toEqual({ id: 'c1', username: 'jane.doe' });
  });

  it('throws ConflictError when the username is already taken', async () => {
    const service = Object.create(AuthService.prototype);
    service.authRepository = {
      findByUsername: jest.fn().mockResolvedValue({ id: 'existing' }),
      createCustomer: jest.fn(),
    };

    await expect(service.register('jane.doe', 'password123')).rejects.toThrow(ConflictError);
    expect(service.authRepository.createCustomer).not.toHaveBeenCalled();
  });

  it('throws ConflictError (not a raw DB error) when createCustomer races past the findByUsername check', async () => {
    const service = Object.create(AuthService.prototype);
    service.authRepository = {
      findByUsername: jest.fn().mockResolvedValue(null),
      createCustomer: jest.fn().mockRejectedValue(new UniqueConstraintError({})),
    };
    bcryptHashMock.mockResolvedValue('hashed');

    await expect(service.register('jane.doe', 'password123')).rejects.toThrow(ConflictError);
  });

  it('re-throws unrelated errors from createCustomer unchanged', async () => {
    const service = Object.create(AuthService.prototype);
    const dbError = new Error('connection lost');
    service.authRepository = {
      findByUsername: jest.fn().mockResolvedValue(null),
      createCustomer: jest.fn().mockRejectedValue(dbError),
    };
    bcryptHashMock.mockResolvedValue('hashed');

    await expect(service.register('jane.doe', 'password123')).rejects.toBe(dbError);
  });
});
