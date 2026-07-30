import { jest } from '@jest/globals';

const { default: CustomerRepository } = await import('#repositories/customer.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('CustomerRepository.findByIdWithAddresses', () => {
  it('includes the Address model scoped to the same tenant schema when looking up the customer by id', async () => {
    const customer = { id: 'c1', Addresses: [] };
    const scopedModel = { findByPk: jest.fn().mockResolvedValue(customer) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const scopedAddressModel = {};
    const addressModel = { schema: jest.fn().mockReturnValue(scopedAddressModel) };
    const repository = Object.create(CustomerRepository.prototype);
    repository.model = model;
    repository.addressModel = addressModel;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.findByIdWithAddresses('c1'),
    );

    expect(addressModel.schema).toHaveBeenCalledWith('tenant_x');
    expect(scopedModel.findByPk).toHaveBeenCalledWith('c1', { include: [{ model: scopedAddressModel }] });
    expect(result).toBe(customer);
  });
});
