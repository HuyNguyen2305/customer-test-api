import { jest } from '@jest/globals';

const { default: CustomerInvoiceItemRepository } = await import('#repositories/customer-invoice-item.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('CustomerInvoiceItemRepository.deleteItem', () => {
  it('returns true when a row scoped by id and customerInvoiceId was destroyed', async () => {
    const scopedModel = { destroy: jest.fn().mockResolvedValue(1) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerInvoiceItemRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.deleteItem('ii1', 'i1'),
    );

    expect(scopedModel.destroy).toHaveBeenCalledWith({ where: { id: 'ii1', customerInvoiceId: 'i1' } });
    expect(result).toBe(true);
  });

  it('returns false when nothing was destroyed (wrong id/invoice)', async () => {
    const scopedModel = { destroy: jest.fn().mockResolvedValue(0) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerInvoiceItemRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.deleteItem('ii1', 'wrong-invoice'),
    );

    expect(result).toBe(false);
  });
});
