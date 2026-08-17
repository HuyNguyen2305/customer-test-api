import { jest } from '@jest/globals';

const { default: AddressRepository } = await import('#repositories/address.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('AddressRepository.getByIdForCustomer', () => {
  it('scopes the lookup by both id and customerId', async () => {
    const address = { id: 'a1', customerId: 'c1' };
    const scopedModel = { findOne: jest.fn().mockResolvedValue(address) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(AddressRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.getByIdForCustomer('a1', 'c1'),
    );

    expect(scopedModel.findOne).toHaveBeenCalledWith({
      where: { id: 'a1', customerId: 'c1' },
      attributes: { exclude: ['customerId', 'createdAt', 'updatedAt'] },
    });
    expect(result).toBe(address);
  });

  it("returns null when the address belongs to a different customer (never leaks another owner's row)", async () => {
    const scopedModel = { findOne: jest.fn().mockResolvedValue(null) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(AddressRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.getByIdForCustomer('a1', 'someone-else'),
    );

    expect(result).toBeNull();
  });
});
