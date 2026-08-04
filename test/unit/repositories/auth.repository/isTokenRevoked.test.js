import { jest } from '@jest/globals';

const { default: AuthRepository } = await import('#repositories/auth.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('AuthRepository.isTokenRevoked', () => {
  it('returns true when a matching revoked-token record exists', async () => {
    const scopedModel = { findOne: jest.fn().mockResolvedValue({ id: 'r1' }) };
    const revokedTokenModel = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(AuthRepository.prototype);
    repository.revokedTokenModel = revokedTokenModel;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.isTokenRevoked('t1'),
    );

    expect(scopedModel.findOne).toHaveBeenCalledWith({ where: { jti: 't1' } });
    expect(result).toBe(true);
  });

  it('returns false when no matching record exists', async () => {
    const scopedModel = { findOne: jest.fn().mockResolvedValue(null) };
    const revokedTokenModel = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(AuthRepository.prototype);
    repository.revokedTokenModel = revokedTokenModel;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.isTokenRevoked('t1'),
    );

    expect(result).toBe(false);
  });
});
