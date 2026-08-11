import { jest } from '@jest/globals';

const { default: AddressRepository } = await import('#repositories/address.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('AddressRepository.updateAddress', () => {
  it('updates and re-fetches the address scoped by id and customerId when the row exists', async () => {
    const updated = { id: 'a1', customerId: 'c1', label: 'Work' };
    const scopedModel = {
      update: jest.fn().mockResolvedValue([1]),
      findOne: jest.fn().mockResolvedValue(updated),
    };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(AddressRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.updateAddress('a1', 'c1', { label: 'Work' }),
    );

    expect(scopedModel.update).toHaveBeenCalledWith({ label: 'Work' }, { where: { id: 'a1', customerId: 'c1' } });
    expect(scopedModel.findOne).toHaveBeenCalledWith({ where: { id: 'a1', customerId: 'c1' } });
    expect(result).toBe(updated);
  });

  it("returns null without a re-fetch when the address doesn't exist for that customer", async () => {
    const scopedModel = {
      update: jest.fn().mockResolvedValue([0]),
      findOne: jest.fn(),
    };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(AddressRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.updateAddress('a1', 'someone-else', { label: 'Work' }),
    );

    expect(scopedModel.findOne).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
