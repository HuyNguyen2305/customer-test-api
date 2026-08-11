import { jest } from '@jest/globals';

const { default: AddressRepository } = await import('#repositories/address.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('AddressRepository.createAddress', () => {
  it('creates an address row scoped to the tenant schema', async () => {
    const scopedModel = { create: jest.fn().mockResolvedValue({ id: 'a1' }) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(AddressRepository.prototype);
    repository.model = model;

    const data = { customerId: 'c1', label: 'Home', line1: '1 Main St', isDefault: true };
    await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () => repository.createAddress(data));

    expect(model.schema).toHaveBeenCalledWith('tenant_x');
    expect(scopedModel.create).toHaveBeenCalledWith(data, undefined);
  });
});
