import { jest } from '@jest/globals';

const { default: CustomerLineItemRepository } = await import('#repositories/customer-line-item.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('CustomerLineItemRepository.bulkCreateItems', () => {
  it('bulk-creates the given items scoped to the tenant schema, forwarding any options', async () => {
    const created = [{ id: 'ii1' }, { id: 'ii2' }];
    const scopedModel = { bulkCreate: jest.fn().mockResolvedValue(created) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerLineItemRepository.prototype);
    repository.model = model;

    const items = [
      { parentId: 'i1', parentType: 'invoice', itemId: 'a' },
      { parentId: 'i1', parentType: 'invoice', itemId: 'b' },
    ];
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
    const repository = Object.create(CustomerLineItemRepository.prototype);
    repository.model = model;

    const result = await repository.bulkCreateItems([]);

    expect(scopedModel.bulkCreate).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});
