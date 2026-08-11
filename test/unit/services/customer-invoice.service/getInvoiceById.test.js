import { jest } from '@jest/globals';

const { default: CustomerInvoiceService } = await import('#service/customer-invoice.service.js');
const { NotFoundError } = await import('#configs/error.js');

const baseInvoice = {
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

describe('CustomerInvoiceService.getInvoiceById', () => {
  it('maps the invoice (without items) to the DTO when none are loaded', async () => {
    const service = Object.create(CustomerInvoiceService.prototype);
    service.customerInvoiceRepository = { findByIdForCustomer: jest.fn().mockResolvedValue(baseInvoice) };

    const result = await service.getInvoiceById('i1', 'c1');

    expect(service.customerInvoiceRepository.findByIdForCustomer).toHaveBeenCalledWith('i1', 'c1');
    expect(result).toEqual({
      ...baseInvoice,
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
    });
    expect(result.items).toBeUndefined();
  });

  it('maps items to a clean shape under the `items` key when loaded', async () => {
    const invoiceWithItems = {
      ...baseInvoice,
      items: [
        { id: 'ii1', itemId: 'item1', description: 'Treatment', cost: 100, taxRateId: null, qty: 1, sortOrder: 0 },
      ],
    };
    const service = Object.create(CustomerInvoiceService.prototype);
    service.customerInvoiceRepository = { findByIdForCustomer: jest.fn().mockResolvedValue(invoiceWithItems) };

    const result = await service.getInvoiceById('i1', 'c1');

    expect(result.items).toEqual([
      { id: 'ii1', itemId: 'item1', description: 'Treatment', cost: 100, qty: 1, sortOrder: 0 },
    ]);
  });

  it('throws NotFoundError (never leaking existence) when the invoice belongs to another customer', async () => {
    const service = Object.create(CustomerInvoiceService.prototype);
    service.customerInvoiceRepository = { findByIdForCustomer: jest.fn().mockResolvedValue(null) };

    await expect(service.getInvoiceById('i1', 'someone-else')).rejects.toThrow(NotFoundError);
  });
});
