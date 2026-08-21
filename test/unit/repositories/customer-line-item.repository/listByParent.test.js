import { jest } from '@jest/globals';

const { default: CustomerLineItemRepository } = await import('#repositories/customer-line-item.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('CustomerLineItemRepository.listByParent', () => {
  it('queries line items scoped to the parent, ordered by sortOrder', async () => {
    const scopedModel = { findAll: jest.fn().mockResolvedValue([{ id: 'ii1' }]) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerLineItemRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.listByParent('i1', 'invoice'),
    );

    expect(scopedModel.findAll).toHaveBeenCalledWith({
      where: { parentId: 'i1', parentType: 'invoice' },
      order: [['sortOrder', 'ASC']],
      attributes: { exclude: ['createdAt', 'updatedAt'] },
    });
    expect(result).toEqual([{ id: 'ii1' }]);
  });
});
