import { jest } from '@jest/globals';

const { default: CustomerInvoiceRepository } = await import('#repositories/customer-invoice.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('CustomerInvoiceRepository.findByIdForCustomer', () => {
  it('scopes the lookup by both id and customerId, and includes line items scoped to the same tenant schema', async () => {
    const invoice = { id: 'i1', customerId: 'c1' };
    const scopedModel = { findOne: jest.fn().mockResolvedValue(invoice) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const scopedItemModel = {};
    const customerInvoiceItemModel = { schema: jest.fn().mockReturnValue(scopedItemModel) };
    const repository = Object.create(CustomerInvoiceRepository.prototype);
    repository.model = model;
    repository.customerInvoiceItemModel = customerInvoiceItemModel;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.findByIdForCustomer('i1', 'c1'),
    );

    expect(customerInvoiceItemModel.schema).toHaveBeenCalledWith('tenant_x');
    expect(scopedModel.findOne).toHaveBeenCalledWith({
      where: { id: 'i1', customerId: 'c1' },
      include: [{ model: scopedItemModel }],
    });
    expect(result).toBe(invoice);
  });

  it("returns null when the invoice belongs to a different customer (never leaks another owner's row)", async () => {
    const scopedModel = { findOne: jest.fn().mockResolvedValue(null) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerInvoiceRepository.prototype);
    repository.model = model;
    repository.customerInvoiceItemModel = { schema: jest.fn().mockReturnValue({}) };

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.findByIdForCustomer('i1', 'someone-else'),
    );

    expect(result).toBeNull();
  });
});
