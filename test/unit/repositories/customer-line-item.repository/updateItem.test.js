import { jest } from '@jest/globals';

const { default: CustomerLineItemRepository } = await import('#repositories/customer-line-item.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('CustomerLineItemRepository.updateItem', () => {
  it('updates and re-fetches the item scoped by id, parentId and parentType when the row exists', async () => {
    const updated = { id: 'ii1', parentId: 'i1', parentType: 'invoice', cost: 150 };
    const scopedModel = {
      update: jest.fn().mockResolvedValue([1]),
      findOne: jest.fn().mockResolvedValue(updated),
    };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerLineItemRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.updateItem('ii1', 'i1', 'invoice', { cost: 150 }),
    );

    expect(scopedModel.update).toHaveBeenCalledWith(
      { cost: 150 },
      { where: { id: 'ii1', parentId: 'i1', parentType: 'invoice' } },
    );
    expect(scopedModel.findOne).toHaveBeenCalledWith({
      where: { id: 'ii1', parentId: 'i1', parentType: 'invoice' },
    });
    expect(result).toBe(updated);
  });

  it("returns null without a re-fetch when the item doesn't exist on that parent", async () => {
    const scopedModel = {
      update: jest.fn().mockResolvedValue([0]),
      findOne: jest.fn(),
    };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerLineItemRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.updateItem('ii1', 'wrong-invoice', 'invoice', { cost: 150 }),
    );

    expect(scopedModel.findOne).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
