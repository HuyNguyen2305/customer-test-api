import { jest } from '@jest/globals';

const { default: CustomerInvoiceService } = await import('#service/customer-invoice.service.js');

describe('CustomerInvoiceService.listInvoices', () => {
  it('paginates using default page/pageSize and shapes the result', async () => {
    const rows = [{ id: 'i1' }, { id: 'i2' }];
    const service = Object.create(CustomerInvoiceService.prototype);
    service.customerInvoiceRepository = { listByCustomerId: jest.fn().mockResolvedValue({ rows, count: 2 }) };

    const result = await service.listInvoices('c1');

    expect(service.customerInvoiceRepository.listByCustomerId).toHaveBeenCalledWith('c1', { limit: 20, offset: 0 });
    expect(result).toEqual({
      invoices: rows,
      pagination: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
    });
  });

  it('returns an empty list without error when the customer has no invoices', async () => {
    const service = Object.create(CustomerInvoiceService.prototype);
    service.customerInvoiceRepository = { listByCustomerId: jest.fn().mockResolvedValue({ rows: [], count: 0 }) };

    const result = await service.listInvoices('c1');

    expect(result).toEqual({
      invoices: [],
      pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    });
  });

  it('computes offset for a later page', async () => {
    const service = Object.create(CustomerInvoiceService.prototype);
    service.customerInvoiceRepository = { listByCustomerId: jest.fn().mockResolvedValue({ rows: [], count: 45 }) };

    const result = await service.listInvoices('c1', { page: 3, pageSize: 10 });

    expect(service.customerInvoiceRepository.listByCustomerId).toHaveBeenCalledWith('c1', { limit: 10, offset: 20 });
    expect(result.pagination).toEqual({ page: 3, pageSize: 10, total: 45, totalPages: 5 });
  });
});
