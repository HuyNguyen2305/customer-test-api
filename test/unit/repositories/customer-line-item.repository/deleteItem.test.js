import { jest } from '@jest/globals';

const { default: CustomerLineItemRepository } = await import('#repositories/customer-line-item.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('CustomerLineItemRepository.deleteItem', () => {
  it('returns true when a row scoped by id, parentId and parentType was destroyed', async () => {
    const scopedModel = { destroy: jest.fn().mockResolvedValue(1) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerLineItemRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.deleteItem('ii1', 'i1', 'invoice'),
    );

    expect(scopedModel.destroy).toHaveBeenCalledWith({
      where: { id: 'ii1', parentId: 'i1', parentType: 'invoice' },
    });
    expect(result).toBe(true);
  });

  it('returns false when nothing was destroyed (wrong id/parent)', async () => {
    const scopedModel = { destroy: jest.fn().mockResolvedValue(0) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerLineItemRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.deleteItem('ii1', 'wrong-invoice', 'invoice'),
    );

    expect(result).toBe(false);
  });
});
