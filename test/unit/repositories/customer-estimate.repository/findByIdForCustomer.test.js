import { jest } from '@jest/globals';

const { default: CustomerEstimateRepository } = await import('#repositories/customer-estimate.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('CustomerEstimateRepository.findByIdForCustomer', () => {
  it('scopes the lookup by both id and customerId, and includes line items - no Booking/Address/Customer join', async () => {
    const estimate = { id: 'e1', customerId: 'c1' };
    const scopedModel = { findOne: jest.fn().mockResolvedValue(estimate) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const scopedItemModel = {};
    const scopedItemDefModel = {};
    const customerLineItemModel = { schema: jest.fn().mockReturnValue(scopedItemModel) };
    const repository = Object.create(CustomerEstimateRepository.prototype);
    repository.model = model;
    repository.customerLineItemModel = customerLineItemModel;
    repository.itemModel = { schema: jest.fn().mockReturnValue(scopedItemDefModel) };

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.findByIdForCustomer('e1', 'c1'),
    );

    expect(customerLineItemModel.schema).toHaveBeenCalledWith('tenant_x');
    expect(scopedModel.findOne).toHaveBeenCalledWith({
      where: { id: 'e1', customerId: 'c1' },
      attributes: { exclude: ['updatedAt'] },
      include: [
        {
          model: scopedItemModel,
          as: 'items',
          include: [{ model: scopedItemDefModel, attributes: ['name'] }],
        },
      ],
    });
    expect(result).toBe(estimate);
  });
});
