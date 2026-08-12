import { jest } from '@jest/globals';

const { default: CustomerInvoiceService } = await import('#service/customer-invoice.service.js');

const invoiceRow = {
  id: 'i1',
  bookingId: 'b1',
  customerId: 'c1',
  sourceInvoiceId: null,
  discountValue: 10,
  discountType: 'percent',
  termsText: 'Net 30',
  notesText: null,
  status: 'sent',
  balanceDue: 100,
};

describe('CustomerInvoiceService.listInvoices', () => {
  it('paginates using default page/pageSize and maps rows to the invoice DTO', async () => {
    const service = Object.create(CustomerInvoiceService.prototype);
    service.customerInvoiceRepository = {
      listByCustomerId: jest.fn().mockResolvedValue({ rows: [invoiceRow], count: 1 }),
    };

    const result = await service.listInvoices('c1');

    expect(service.customerInvoiceRepository.listByCustomerId).toHaveBeenCalledWith('c1', { limit: 20, offset: 0 });
    expect(result).toEqual({
      invoices: [
        {
          id: 'i1',
          bookingId: 'b1',
          customerId: 'c1',
          sourceInvoiceId: null,
          discountValue: 10,
          discountType: 'percent',
          termsText: 'Net 30',
          notesText: null,
          status: 'sent',
          statusLabel: 'Open',
          balanceDue: 100,
          addressId: undefined,
          addressLabel: undefined,
          addressLine1: undefined,
          addressLine2: undefined,
          addressCity: undefined,
          addressState: undefined,
          addressZip: undefined,
          addressCountry: undefined,
          subtotal: 0,
          discountAmount: 0,
          taxableAmount: 0,
          taxes: [],
          taxTotal: 0,
          total: 0,
        },
      ],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
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

  it('maps a non-sent status (e.g. draft) to a null statusLabel', async () => {
    const draftRow = { ...invoiceRow, status: 'draft' };
    const service = Object.create(CustomerInvoiceService.prototype);
    service.customerInvoiceRepository = {
      listByCustomerId: jest.fn().mockResolvedValue({ rows: [draftRow], count: 1 }),
    };

    const result = await service.listInvoices('c1');

    expect(result.invoices[0].statusLabel).toBeNull();
  });

  it('forwards addressId, status, and statusOrder to the repository unchanged', async () => {
    const service = Object.create(CustomerInvoiceService.prototype);
    service.customerInvoiceRepository = { listByCustomerId: jest.fn().mockResolvedValue({ rows: [], count: 0 }) };

    await service.listInvoices('c1', { addressId: 'a1', status: 'sent', statusOrder: 'asc' });

    expect(service.customerInvoiceRepository.listByCustomerId).toHaveBeenCalledWith('c1', {
      limit: 20,
      offset: 0,
      addressId: 'a1',
      status: 'sent',
      statusOrder: 'asc',
    });
  });
});
