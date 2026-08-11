import { jest } from '@jest/globals';

const { default: AddressRepository } = await import('#repositories/address.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('AddressRepository.listByCustomerId', () => {
  it('queries addresses scoped to the customerId, defaults first then oldest', async () => {
    const scopedModel = { findAll: jest.fn().mockResolvedValue([{ id: 'a1' }]) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(AddressRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.listByCustomerId('c1'),
    );

    expect(scopedModel.findAll).toHaveBeenCalledWith({
      where: { customerId: 'c1' },
      order: [
        ['isDefault', 'DESC'],
        ['createdAt', 'ASC'],
      ],
    });
    expect(result).toEqual([{ id: 'a1' }]);
  });
});
