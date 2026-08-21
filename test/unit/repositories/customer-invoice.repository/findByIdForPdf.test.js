import { jest } from '@jest/globals';

const { default: CustomerInvoiceRepository } = await import('#repositories/customer-invoice.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('CustomerInvoiceRepository.findByIdForPdf', () => {
  it('includes items and the Customer join, on top of the same id/customerId scoping as findByIdForCustomer', async () => {
    const invoice = { id: 'i1', customerId: 'c1' };
    const scopedModel = { findOne: jest.fn().mockResolvedValue(invoice) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const scopedItemModel = {};
    const scopedCustomerModel = {};
    const repository = Object.create(CustomerInvoiceRepository.prototype);
    repository.model = model;
    repository.customerLineItemModel = { schema: jest.fn().mockReturnValue(scopedItemModel) };
    repository.customerModel = { schema: jest.fn().mockReturnValue(scopedCustomerModel) };

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.findByIdForPdf('i1', 'c1'),
    );

    expect(scopedModel.findOne).toHaveBeenCalledWith({
      where: { id: 'i1', customerId: 'c1' },
      attributes: { exclude: ['updatedAt'] },
      include: [
        { model: scopedItemModel, as: 'items' },
        { model: scopedCustomerModel, as: 'Customer' },
      ],
    });
    expect(result).toBe(invoice);
  });
});
