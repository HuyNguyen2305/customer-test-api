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
      statusLabel: 'Open',
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

  it('maps a non-sent status (e.g. draft) to a null statusLabel', async () => {
    const draftInvoice = { ...baseInvoice, status: 'draft' };
    const service = Object.create(CustomerInvoiceService.prototype);
    service.customerInvoiceRepository = { findByIdForCustomer: jest.fn().mockResolvedValue(draftInvoice) };

    const result = await service.getInvoiceById('i1', 'c1');

    expect(result.statusLabel).toBeNull();
  });

  it('computes each tax row amount from its own stored taxableBase, not the whole invoice taxableAmount', async () => {
    const invoiceWithTaxes = {
      ...baseInvoice,
      discountValue: 0,
      discountType: 'flat',
      items: [
        { id: 'ii1', itemId: 'item1', description: 'A', cost: 30, qty: 1, sortOrder: 0 },
        { id: 'ii2', itemId: 'item2', description: 'B', cost: 70, qty: 1, sortOrder: 1 },
      ],
      taxes: [
        { id: 't1', name: 'Tax A', code: 'A', rate: 5, type: 'sales', taxableBase: 30 },
        { id: 't2', name: 'Tax B', code: 'B', rate: 10, type: 'sales', taxableBase: 70 },
      ],
    };
    const service = Object.create(CustomerInvoiceService.prototype);
    service.customerInvoiceRepository = { findByIdForCustomer: jest.fn().mockResolvedValue(invoiceWithTaxes) };

    const result = await service.getInvoiceById('i1', 'c1');

    // Not 100 (whole taxableAmount) * each rate - each tax only covers its own base.
    expect(result.taxes[0].amount).toBe(1.5); // 30 * 5%
    expect(result.taxes[1].amount).toBe(7); // 70 * 10%
    expect(result.taxTotal).toBe(8.5);
    expect(result.total).toBe(108.5);
  });

  it('falls back to the whole invoice taxableAmount when a tax row has no stored taxableBase', async () => {
    const invoiceWithSingleTax = {
      ...baseInvoice,
      discountValue: 0,
      discountType: 'flat',
      items: [{ id: 'ii1', itemId: 'item1', description: 'A', cost: 100, qty: 1, sortOrder: 0 }],
      taxes: [{ id: 't1', name: 'State Tax', code: 'ST', rate: 8, type: 'sales', taxableBase: null }],
    };
    const service = Object.create(CustomerInvoiceService.prototype);
    service.customerInvoiceRepository = { findByIdForCustomer: jest.fn().mockResolvedValue(invoiceWithSingleTax) };

    const result = await service.getInvoiceById('i1', 'c1');

    expect(result.taxes[0].amount).toBe(8); // 100 (whole taxableAmount) * 8%
    expect(result.taxTotal).toBe(8);
  });
});
