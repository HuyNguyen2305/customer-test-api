import { jest } from '@jest/globals';

const { default: CustomerInvoiceItemRepository } = await import('#repositories/customer-invoice-item.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('CustomerInvoiceItemRepository.bulkCreateItems', () => {
  it('bulk-creates the given items scoped to the tenant schema, forwarding any options', async () => {
    const created = [{ id: 'ii1' }, { id: 'ii2' }];
    const scopedModel = { bulkCreate: jest.fn().mockResolvedValue(created) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerInvoiceItemRepository.prototype);
    repository.model = model;

    const items = [{ customerInvoiceId: 'i1', itemId: 'a' }, { customerInvoiceId: 'i1', itemId: 'b' }];
    const options = { transaction: 'tx' };
    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.bulkCreateItems(items, options),
    );

    expect(scopedModel.bulkCreate).toHaveBeenCalledWith(items, options);
    expect(result).toBe(created);
  });

  it('short-circuits to an empty array without touching the model when there are no items', async () => {
    const scopedModel = { bulkCreate: jest.fn() };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerInvoiceItemRepository.prototype);
    repository.model = model;

    const result = await repository.bulkCreateItems([]);

    expect(scopedModel.bulkCreate).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});
