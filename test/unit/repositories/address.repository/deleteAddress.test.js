import { jest } from '@jest/globals';

const { default: AddressRepository } = await import('#repositories/address.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('AddressRepository.deleteAddress', () => {
  it('returns true when a row scoped by id and customerId was destroyed', async () => {
    const scopedModel = { destroy: jest.fn().mockResolvedValue(1) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(AddressRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.deleteAddress('a1', 'c1'),
    );

    expect(scopedModel.destroy).toHaveBeenCalledWith({ where: { id: 'a1', customerId: 'c1' } });
    expect(result).toBe(true);
  });

  it("returns false when nothing was destroyed (wrong id/customer)", async () => {
    const scopedModel = { destroy: jest.fn().mockResolvedValue(0) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(AddressRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.deleteAddress('a1', 'someone-else'),
    );

    expect(result).toBe(false);
  });
});
