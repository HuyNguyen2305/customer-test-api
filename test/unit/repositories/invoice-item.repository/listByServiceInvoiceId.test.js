import { jest } from '@jest/globals';

const { default: InvoiceItemRepository } = await import('#repositories/invoice-item.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('InvoiceItemRepository.listByServiceInvoiceId', () => {
  it('queries template line items scoped to the service invoice, ordered by sortOrder', async () => {
    const scopedModel = { findAll: jest.fn().mockResolvedValue([{ id: 'ti1' }]) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(InvoiceItemRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.listByServiceInvoiceId('si1'),
    );

    expect(scopedModel.findAll).toHaveBeenCalledWith({
      where: { serviceInvoiceId: 'si1' },
      order: [['sortOrder', 'ASC']],
    });
    expect(result).toEqual([{ id: 'ti1' }]);
  });
});
