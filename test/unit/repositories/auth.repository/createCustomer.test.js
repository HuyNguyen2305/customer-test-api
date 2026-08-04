import { jest } from '@jest/globals';

const { default: AuthRepository } = await import('#repositories/auth.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('AuthRepository.createCustomer', () => {
  it('creates a customer row scoped to the tenant schema', async () => {
    const scopedModel = { create: jest.fn().mockResolvedValue({ id: 'c1' }) };
    const customerModel = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(AuthRepository.prototype);
    repository.customerModel = customerModel;

    const data = { username: 'jane.doe', passwordHash: 'hashed', isRegistered: true };
    await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () => repository.createCustomer(data));

    expect(customerModel.schema).toHaveBeenCalledWith('tenant_x');
    expect(scopedModel.create).toHaveBeenCalledWith(data);
  });
});
