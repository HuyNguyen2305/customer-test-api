import { jest } from '@jest/globals';

const { default: AuthRepository } = await import('#repositories/auth.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('AuthRepository.findByUsername', () => {
  it('queries the tenant-scoped customer model by username', async () => {
    const scopedModel = { findOne: jest.fn().mockResolvedValue({ id: 'c1' }) };
    const customerModel = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(AuthRepository.prototype);
    repository.customerModel = customerModel;

    await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.findByUsername('jane.doe'),
    );

    expect(customerModel.schema).toHaveBeenCalledWith('tenant_x');
    expect(scopedModel.findOne).toHaveBeenCalledWith({ where: { username: 'jane.doe' } });
  });

  it('falls back to the unscoped model when no tenant schema is set', async () => {
    const customerModel = { findOne: jest.fn().mockResolvedValue(null), schema: jest.fn() };
    const repository = Object.create(AuthRepository.prototype);
    repository.customerModel = customerModel;

    await requestContext.run(new Map(), () => repository.findByUsername('jane.doe'));

    expect(customerModel.schema).not.toHaveBeenCalled();
    expect(customerModel.findOne).toHaveBeenCalledWith({ where: { username: 'jane.doe' } });
  });
});
