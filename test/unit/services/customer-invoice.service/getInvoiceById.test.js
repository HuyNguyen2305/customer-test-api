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
      addressLabel: null,
      addressLine1: null,
      addressLine2: null,
      addressCity: null,
      addressState: null,
      addressZip: null,
      addressCountry: null,
      subtotal: 0,
      discountAmount: 0,
      taxableAmount: 0,
      taxes: [],
      taxTotal: 0,
      total: 0,
    });
    expect(result.items).toBeUndefined();
  });

  it('maps items to a clean shape under the `items` key when loaded, including their persisted tax columns', async () => {
    const invoiceWithItems = {
      ...baseInvoice,
      items: [
        {
          id: 'ii1',
          itemId: 'item1',
          description: 'Treatment',
          cost: 100,
          qty: 1,
          sortOrder: 0,
          subtotal: 100,
          taxSlots: {
            tax1RateId: null,
            tax1Name: null,
            tax1Rate: null,
            tax1Total: null,
            tax2RateId: null,
            tax2Name: null,
            tax2Rate: null,
            tax2Total: null,
          },
          total: 100,
        },
      ],
    };
    const service = Object.create(CustomerInvoiceService.prototype);
    service.customerInvoiceRepository = { findByIdForCustomer: jest.fn().mockResolvedValue(invoiceWithItems) };

    const result = await service.getInvoiceById('i1', 'c1');

    expect(result.items).toEqual([
      {
        id: 'ii1',
        itemId: 'item1',
        description: 'Treatment',
        cost: 100,
        qty: 1,
        sortOrder: 0,
        subtotal: 100,
        tax1RateId: null,
        tax1Name: null,
        tax1Rate: null,
        tax1Total: null,
        tax2RateId: null,
        tax2Name: null,
        tax2Rate: null,
        tax2Total: null,
        total: 100,
      },
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

  it("rolls each item's already-computed tax1/tax2 slots up into one aggregate row per distinct rate", async () => {
    const invoiceWithTaxes = {
      ...baseInvoice,
      discountValue: 0,
      discountType: 'flat',
      items: [
        {
          id: 'ii1',
          itemId: 'item1',
          description: 'A',
          cost: 30,
          qty: 1,
          sortOrder: 0,
          subtotal: 30,
          taxSlots: { tax1RateId: 't1', tax1Name: 'Tax A', tax1Rate: 5, tax1Total: 1.5, tax2RateId: null },
          total: 31.5,
        },
        {
          id: 'ii2',
          itemId: 'item2',
          description: 'B',
          cost: 70,
          qty: 1,
          sortOrder: 1,
          subtotal: 70,
          taxSlots: { tax1RateId: 't2', tax1Name: 'Tax B', tax1Rate: 10, tax1Total: 7, tax2RateId: null },
          total: 77,
        },
      ],
    };
    const service = Object.create(CustomerInvoiceService.prototype);
    service.customerInvoiceRepository = { findByIdForCustomer: jest.fn().mockResolvedValue(invoiceWithTaxes) };

    const result = await service.getInvoiceById('i1', 'c1');

    expect(result.taxes).toEqual([
      { id: 't1', name: 'Tax A', rate: 5, amount: 1.5 },
      { id: 't2', name: 'Tax B', rate: 10, amount: 7 },
    ]);
    expect(result.taxTotal).toBe(8.5);
    expect(result.total).toBe(108.5);
  });

  it('sums contributions from multiple items sharing the same tax rate into a single aggregate row', async () => {
    const invoiceWithSharedTax = {
      ...baseInvoice,
      discountValue: 0,
      discountType: 'flat',
      items: [
        {
          id: 'ii1',
          subtotal: 100,
          cost: 100,
          qty: 1,
          taxSlots: { tax1RateId: 't1', tax1Name: 'State Tax', tax1Rate: 8, tax1Total: 8 },
          total: 108,
        },
        {
          id: 'ii2',
          subtotal: 50,
          cost: 50,
          qty: 1,
          taxSlots: { tax1RateId: 't1', tax1Name: 'State Tax', tax1Rate: 8, tax1Total: 4 },
          total: 54,
        },
      ],
    };
    const service = Object.create(CustomerInvoiceService.prototype);
    service.customerInvoiceRepository = { findByIdForCustomer: jest.fn().mockResolvedValue(invoiceWithSharedTax) };

    const result = await service.getInvoiceById('i1', 'c1');

    expect(result.taxes).toEqual([{ id: 't1', name: 'State Tax', rate: 8, amount: 12 }]);
    expect(result.taxTotal).toBe(12);
  });
});
