import { jest } from '@jest/globals';

const { default: CustomerInvoiceService } = await import('#service/customer-invoice.service.js');
const { NotFoundError } = await import('#configs/error.js');

describe('CustomerInvoiceService.getInvoiceById', () => {
  it('returns the invoice scoped to the customer', async () => {
    const invoice = { id: 'i1', customerId: 'c1' };
    const service = Object.create(CustomerInvoiceService.prototype);
    service.customerInvoiceRepository = { findByIdForCustomer: jest.fn().mockResolvedValue(invoice) };

    const result = await service.getInvoiceById('i1', 'c1');

    expect(service.customerInvoiceRepository.findByIdForCustomer).toHaveBeenCalledWith('i1', 'c1');
    expect(result).toBe(invoice);
  });

  it('throws NotFoundError (never leaking existence) when the invoice belongs to another customer', async () => {
    const service = Object.create(CustomerInvoiceService.prototype);
    service.customerInvoiceRepository = { findByIdForCustomer: jest.fn().mockResolvedValue(null) };

    await expect(service.getInvoiceById('i1', 'someone-else')).rejects.toThrow(NotFoundError);
  });
});
