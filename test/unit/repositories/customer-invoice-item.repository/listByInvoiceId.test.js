import { jest } from '@jest/globals';

const { default: CustomerInvoiceItemRepository } = await import('#repositories/customer-invoice-item.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('CustomerInvoiceItemRepository.listByInvoiceId', () => {
  it('queries line items scoped to the invoice, ordered by sortOrder', async () => {
    const scopedModel = { findAll: jest.fn().mockResolvedValue([{ id: 'ii1' }]) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerInvoiceItemRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.listByInvoiceId('i1'),
    );

    expect(scopedModel.findAll).toHaveBeenCalledWith({
      where: { customerInvoiceId: 'i1' },
      order: [['sortOrder', 'ASC']],
    });
    expect(result).toEqual([{ id: 'ii1' }]);
  });
});
