import { jest } from '@jest/globals';

const { default: AuthService } = await import('#service/auth.service.js');

describe('AuthService.logout', () => {
  it('revokes the token with expiresAt derived from exp', async () => {
    const service = Object.create(AuthService.prototype);
    service.authRepository = { revokeToken: jest.fn().mockResolvedValue(undefined) };

    const exp = 1_700_000_000;
    await service.logout({ jti: 't1', customerId: 'c1', exp });

    expect(service.authRepository.revokeToken).toHaveBeenCalledWith({
      jti: 't1',
      customerId: 'c1',
      expiresAt: new Date(exp * 1000),
    });
  });
});
