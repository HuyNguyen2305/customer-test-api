import { jest } from '@jest/globals';

const { default: AuthRepository } = await import('#repositories/auth.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('AuthRepository.updatePasswordHash', () => {
  it('updates the passwordHash for the given customer, scoped to the tenant schema', async () => {
    const scopedModel = { update: jest.fn().mockResolvedValue([1]) };
    const customerModel = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(AuthRepository.prototype);
    repository.customerModel = customerModel;

    await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.updatePasswordHash('c1', 'new-hash'),
    );

    expect(customerModel.schema).toHaveBeenCalledWith('tenant_x');
    expect(scopedModel.update).toHaveBeenCalledWith({ passwordHash: 'new-hash' }, { where: { id: 'c1' } });
  });
});
