import { jest } from '@jest/globals';

const { default: CustomerInvoiceItemRepository } = await import('#repositories/customer-invoice-item.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('CustomerInvoiceItemRepository.updateItem', () => {
  it('updates and re-fetches the item scoped by id and customerInvoiceId when the row exists', async () => {
    const updated = { id: 'ii1', customerInvoiceId: 'i1', cost: 150 };
    const scopedModel = {
      update: jest.fn().mockResolvedValue([1]),
      findOne: jest.fn().mockResolvedValue(updated),
    };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerInvoiceItemRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.updateItem('ii1', 'i1', { cost: 150 }),
    );

    expect(scopedModel.update).toHaveBeenCalledWith({ cost: 150 }, { where: { id: 'ii1', customerInvoiceId: 'i1' } });
    expect(scopedModel.findOne).toHaveBeenCalledWith({ where: { id: 'ii1', customerInvoiceId: 'i1' } });
    expect(result).toBe(updated);
  });

  it("returns null without a re-fetch when the item doesn't exist on that invoice", async () => {
    const scopedModel = {
      update: jest.fn().mockResolvedValue([0]),
      findOne: jest.fn(),
    };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerInvoiceItemRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.updateItem('ii1', 'wrong-invoice', { cost: 150 }),
    );

    expect(scopedModel.findOne).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });
});
