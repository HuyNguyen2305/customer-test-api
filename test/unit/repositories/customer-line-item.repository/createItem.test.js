import { jest } from '@jest/globals';

const { default: CustomerLineItemRepository } = await import('#repositories/customer-line-item.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('CustomerLineItemRepository.createItem', () => {
  it('creates a line item row scoped to the tenant schema', async () => {
    const scopedModel = { create: jest.fn().mockResolvedValue({ id: 'ii1' }) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerLineItemRepository.prototype);
    repository.model = model;

    const data = {
      parentId: 'i1',
      parentType: 'invoice',
      itemId: 'item1',
      description: 'Treatment',
      cost: 100,
      qty: 1,
    };
    await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () => repository.createItem(data));

    expect(model.schema).toHaveBeenCalledWith('tenant_x');
    expect(scopedModel.create).toHaveBeenCalledWith(data, undefined);
  });
});
