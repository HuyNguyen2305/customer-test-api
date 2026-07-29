import { jest } from '@jest/globals';

const { default: InvoiceService } = await import('#service/invoice.service.js');

describe('InvoiceService.listInvoices', () => {
  it('paginates using default page/pageSize and shapes the result', async () => {
    const rows = [{ id: 'i1' }, { id: 'i2' }];
    const service = Object.create(InvoiceService.prototype);
    service.invoiceRepository = { listInvoices: jest.fn().mockResolvedValue({ rows, count: 2 }) };

    const result = await service.listInvoices('c1');

    expect(service.invoiceRepository.listInvoices).toHaveBeenCalledWith('c1', {
      status: undefined,
      limit: 20,
      offset: 0,
    });
    expect(result).toEqual({
      invoices: rows,
      pagination: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
    });
  });

  it('computes offset and totalPages for a later page and forwards the status filter', async () => {
    const service = Object.create(InvoiceService.prototype);
    service.invoiceRepository = { listInvoices: jest.fn().mockResolvedValue({ rows: [], count: 45 }) };

    const result = await service.listInvoices('c1', { page: 3, pageSize: 10, status: 'open' });

    expect(service.invoiceRepository.listInvoices).toHaveBeenCalledWith('c1', {
      status: 'open',
      limit: 10,
      offset: 20,
    });
    expect(result.pagination).toEqual({ page: 3, pageSize: 10, total: 45, totalPages: 5 });
  });
});
