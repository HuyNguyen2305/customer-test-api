import { jest } from '@jest/globals';

const { default: InvoiceService } = await import('#service/invoice.service.js');
const { NotFoundError } = await import('#configs/error.js');

describe('InvoiceService.getInvoiceById', () => {
  it('returns the invoice from the repository', async () => {
    const invoice = { id: 'i1', customerId: 'c1', amount: 42 };
    const service = Object.create(InvoiceService.prototype);
    service.invoiceRepository = { getInvoiceById: jest.fn().mockResolvedValue(invoice) };

    const result = await service.getInvoiceById('i1', 'c1');

    expect(service.invoiceRepository.getInvoiceById).toHaveBeenCalledWith('i1', 'c1');
    expect(result).toBe(invoice);
  });

  it('throws NotFoundError when no invoice exists', async () => {
    const service = Object.create(InvoiceService.prototype);
    service.invoiceRepository = { getInvoiceById: jest.fn().mockResolvedValue(null) };

    await expect(service.getInvoiceById('missing', 'c1')).rejects.toThrow(NotFoundError);
  });
});
