import { jest } from '@jest/globals';

const { default: CustomerEstimateRepository } = await import('#repositories/customer-estimate.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('CustomerEstimateRepository.findByIdForCustomer', () => {
  it('scopes the lookup by both id and customerId, and includes line items scoped to the same tenant schema', async () => {
    const estimate = { id: 'e1', customerId: 'c1' };
    const scopedModel = { findOne: jest.fn().mockResolvedValue(estimate) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const scopedItemModel = {};
    const customerEstimateItemModel = { schema: jest.fn().mockReturnValue(scopedItemModel) };
    const repository = Object.create(CustomerEstimateRepository.prototype);
    repository.model = model;
    repository.customerEstimateItemModel = customerEstimateItemModel;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.findByIdForCustomer('e1', 'c1'),
    );

    expect(customerEstimateItemModel.schema).toHaveBeenCalledWith('tenant_x');
    expect(scopedModel.findOne).toHaveBeenCalledWith({
      where: { id: 'e1', customerId: 'c1' },
      include: [{ model: scopedItemModel }],
    });
    expect(result).toBe(estimate);
  });
});
