import { jest } from '@jest/globals';

const { default: CustomerInvoiceRepository } = await import('#repositories/customer-invoice.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('CustomerInvoiceRepository.findSummaryByIdForCustomer', () => {
  it('fetches only the columns needed for the ownership/status pre-check, with no joins', async () => {
    const invoice = { id: 'i1', status: 'draft', discountType: 'flat', discountValue: 0, customerId: 'c1' };
    const scopedModel = { findOne: jest.fn().mockResolvedValue(invoice) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerInvoiceRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.findSummaryByIdForCustomer('i1', 'c1'),
    );

    expect(scopedModel.findOne).toHaveBeenCalledWith({
      where: { id: 'i1', customerId: 'c1' },
      attributes: ['id', 'status', 'discountType', 'discountValue', 'customerId'],
    });
    expect(result).toBe(invoice);
  });
});
