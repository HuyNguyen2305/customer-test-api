import { jest } from '@jest/globals';

const bcryptHashMock = jest.fn();

jest.unstable_mockModule('bcryptjs', () => ({
  default: { hash: bcryptHashMock, compare: jest.fn() },
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: { sign: jest.fn() },
}));

const { default: AuthService } = await import('#service/auth.service.js');

describe('AuthService.changePassword', () => {
  beforeEach(() => bcryptHashMock.mockReset());

  it('hashes the new password, updates it, and revokes the current token', async () => {
    const service = Object.create(AuthService.prototype);
    service.authRepository = {
      updatePasswordHash: jest.fn().mockResolvedValue(undefined),
      revokeToken: jest.fn().mockResolvedValue(undefined),
    };
    bcryptHashMock.mockResolvedValue('new-hash');

    const exp = 1_700_000_000;
    await service.changePassword({ customerId: 'c1', newPassword: 'newpass456', jti: 't1', exp });

    expect(bcryptHashMock).toHaveBeenCalledWith('newpass456', 10);
    expect(service.authRepository.updatePasswordHash).toHaveBeenCalledWith('c1', 'new-hash');
    expect(service.authRepository.revokeToken).toHaveBeenCalledWith({
      jti: 't1',
      customerId: 'c1',
      expiresAt: new Date(exp * 1000),
    });
  });
});
