import { jest } from '@jest/globals';

const { default: CustomerPaymentMethodRepository } =
  await import('#repositories/customer-payment-method.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('CustomerPaymentMethodRepository.listByCustomerId', () => {
  it('queries payment methods scoped to the customerId', async () => {
    const scopedModel = { findAll: jest.fn().mockResolvedValue([{ id: 'pm1' }]) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerPaymentMethodRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.listByCustomerId('c1'),
    );

    expect(scopedModel.findAll).toHaveBeenCalledWith({
      where: { customerId: 'c1' },
      attributes: { exclude: ['customerId', 'createdAt', 'updatedAt'] },
    });
    expect(result).toEqual([{ id: 'pm1' }]);
  });
});
