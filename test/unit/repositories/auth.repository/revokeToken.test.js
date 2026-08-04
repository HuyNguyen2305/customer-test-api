import { jest } from '@jest/globals';

const { default: AuthRepository } = await import('#repositories/auth.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('AuthRepository.revokeToken', () => {
  it('creates a revoked-token record scoped to the tenant schema', async () => {
    const scopedModel = { create: jest.fn().mockResolvedValue({}) };
    const revokedTokenModel = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(AuthRepository.prototype);
    repository.revokedTokenModel = revokedTokenModel;

    const expiresAt = new Date('2026-08-05T00:00:00Z');
    await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.revokeToken({ jti: 't1', customerId: 'c1', expiresAt }),
    );

    expect(revokedTokenModel.schema).toHaveBeenCalledWith('tenant_x');
    expect(scopedModel.create).toHaveBeenCalledWith({ jti: 't1', customerId: 'c1', expiresAt });
  });
});
