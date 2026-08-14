import { jest } from '@jest/globals';

const { default: InvoiceGenerationService } = await import('#service/invoice-generation.service.js');
const { ConflictError } = await import('#configs/error.js');
const { UniqueConstraintError } = await import('sequelize');

function buildService({ existingInvoice = null, booking = null, created } = {}) {
  const service = Object.create(InvoiceGenerationService.prototype);
  service.bookingRepository = { findByPk: jest.fn().mockResolvedValue(booking) };
  service.customerInvoiceRepository = {
    findByEstimateId: jest.fn().mockResolvedValue(existingInvoice),
    createInvoice: jest.fn().mockResolvedValue(created),
  };
  service.addressRepository = { getByIdForCustomer: jest.fn().mockResolvedValue(null) };
  service.customerInvoiceItemRepository = { bulkCreateItems: jest.fn().mockResolvedValue([]) };
  service.taxRateRepository = { findByPk: jest.fn().mockResolvedValue(null) };
  service.customerInvoiceTaxRepository = { createTax: jest.fn().mockResolvedValue(null) };
  service.customerEstimateRepository = { updateStatus: jest.fn().mockResolvedValue([1]) };
  return service;
}

describe('InvoiceGenerationService.generateInvoiceFromEstimate', () => {
  it('throws ConflictError when an invoice already exists for the estimate (idempotency)', async () => {
    const service = buildService({ existingInvoice: { id: 'existing' } });
    const estimate = { id: 'e1', bookingId: 'b1', customerId: 'c1', status: 'sent', items: [] };

    await expect(service.generateInvoiceFromEstimate(estimate, 'c1')).rejects.toThrow(ConflictError);
    expect(service.customerInvoiceRepository.createInvoice).not.toHaveBeenCalled();
  });

  it('creates a draft invoice copying discount/terms/notes from the estimate', async () => {
    const created = { id: 'inv1' };
    const service = buildService({ created });
    const estimate = {
      id: 'e1',
      bookingId: 'b1',
      customerId: 'c1',
      status: 'sent',
      discountValue: 10,
      discountType: 'flat',
      termsText: 'terms',
      notesText: 'notes',
      items: [],
    };

    const result = await service.generateInvoiceFromEstimate(estimate, 'c1');

    expect(service.customerInvoiceRepository.createInvoice).toHaveBeenCalledWith(
      {
        bookingId: 'b1',
        customerId: 'c1',
        estimateId: 'e1',
        status: 'draft',
        balanceDue: 0,
        discountValue: 10,
        discountType: 'flat',
        termsText: 'terms',
        notesText: 'notes',
        addressId: null,
      },
      expect.anything(),
    );
    expect(result).toBe(created);
  });

  it("flips a 'sent' estimate to 'approved' in the same transaction", async () => {
    const service = buildService({ created: { id: 'inv1' } });
    const estimate = { id: 'e1', bookingId: 'b1', customerId: 'c1', status: 'sent', items: [] };

    await service.generateInvoiceFromEstimate(estimate, 'c1');

    expect(service.customerEstimateRepository.updateStatus).toHaveBeenCalledWith(
      'e1',
      'c1',
      'approved',
      expect.anything(),
    );
  });

  it("does not re-update status when the estimate is already 'approved'", async () => {
    const service = buildService({ created: { id: 'inv1' } });
    const estimate = { id: 'e1', bookingId: 'b1', customerId: 'c1', status: 'approved', items: [] };

    await service.generateInvoiceFromEstimate(estimate, 'c1');

    expect(service.customerEstimateRepository.updateStatus).not.toHaveBeenCalled();
  });

  it('copies estimate items onto the invoice, dropping taxRateId (invoice items have no such column)', async () => {
    const created = { id: 'inv1' };
    const service = buildService({ created });
    const estimate = {
      id: 'e1',
      bookingId: 'b1',
      customerId: 'c1',
      status: 'sent',
      items: [{ itemId: 'item1', description: 'Treatment', cost: 80, taxRateId: 'tax1', qty: 1, sortOrder: 0 }],
    };

    await service.generateInvoiceFromEstimate(estimate, 'c1');

    expect(service.customerInvoiceItemRepository.bulkCreateItems).toHaveBeenCalledWith(
      [{ customerInvoiceId: 'inv1', itemId: 'item1', description: 'Treatment', cost: 80, qty: 1, sortOrder: 0 }],
      expect.anything(),
    );
  });

  it('attaches one CustomerInvoiceTax row per distinct taxRateId referenced by the items, each scoped to just its own items', async () => {
    const created = { id: 'inv1', discountValue: 0, discountType: 'flat' };
    const service = buildService({ created });
    service.taxRateRepository.findByPk = jest.fn(async (id) => ({
      id,
      name: `Tax ${id}`,
      code: id,
      rate: 5,
      type: 'sales',
    }));
    const estimate = {
      id: 'e1',
      bookingId: 'b1',
      customerId: 'c1',
      status: 'sent',
      items: [
        { itemId: 'item1', description: 'A', cost: 10, taxRateId: 'tax1', qty: 1, sortOrder: 0 },
        { itemId: 'item2', description: 'B', cost: 20, taxRateId: 'tax1', qty: 1, sortOrder: 1 },
        { itemId: 'item3', description: 'C', cost: 30, taxRateId: 'tax2', qty: 1, sortOrder: 2 },
        { itemId: 'item4', description: 'D', cost: 40, taxRateId: null, qty: 1, sortOrder: 3 },
      ],
    };

    await service.generateInvoiceFromEstimate(estimate, 'c1');

    expect(service.taxRateRepository.findByPk).toHaveBeenCalledTimes(2);
    expect(service.customerInvoiceTaxRepository.createTax).toHaveBeenCalledTimes(2);
    // tax1 covers items 1+2 (10+20=30), tax2 covers item 3 (30) - item 4 (no
    // rate) and no discount, so each row's base is just its own items' sum.
    expect(service.customerInvoiceTaxRepository.createTax).toHaveBeenCalledWith(
      expect.objectContaining({ customerInvoiceId: 'inv1', taxRateId: 'tax1', taxableBase: 30 }),
      expect.anything(),
    );
    expect(service.customerInvoiceTaxRepository.createTax).toHaveBeenCalledWith(
      expect.objectContaining({ customerInvoiceId: 'inv1', taxRateId: 'tax2', taxableBase: 30 }),
      expect.anything(),
    );
  });

  it('reduces each tax row taxableBase proportionally when the invoice carries a discount', async () => {
    const created = { id: 'inv1', discountValue: 20, discountType: 'flat' };
    const service = buildService({ created });
    service.taxRateRepository.findByPk = jest.fn(async (id) => ({
      id,
      name: `Tax ${id}`,
      code: id,
      rate: 5,
      type: 'sales',
    }));
    const estimate = {
      id: 'e1',
      bookingId: 'b1',
      customerId: 'c1',
      status: 'sent',
      items: [
        { itemId: 'item1', description: 'A', cost: 30, taxRateId: 'tax1', qty: 1, sortOrder: 0 },
        { itemId: 'item2', description: 'B', cost: 70, taxRateId: 'tax2', qty: 1, sortOrder: 1 },
      ],
    };

    await service.generateInvoiceFromEstimate(estimate, 'c1');

    // subtotal 100, discount 20 -> discountRatio 0.2 -> tax1 base 30*0.8=24, tax2 base 70*0.8=56
    expect(service.customerInvoiceTaxRepository.createTax).toHaveBeenCalledWith(
      expect.objectContaining({ taxRateId: 'tax1', taxableBase: 24 }),
      expect.anything(),
    );
    expect(service.customerInvoiceTaxRepository.createTax).toHaveBeenCalledWith(
      expect.objectContaining({ taxRateId: 'tax2', taxableBase: 56 }),
      expect.anything(),
    );
  });

  it('skips a taxRateId that no longer resolves to a TaxRate', async () => {
    const service = buildService({ created: { id: 'inv1' } });
    service.taxRateRepository.findByPk = jest.fn().mockResolvedValue(null);
    const estimate = {
      id: 'e1',
      bookingId: 'b1',
      customerId: 'c1',
      status: 'sent',
      items: [{ itemId: 'item1', description: 'A', cost: 10, taxRateId: 'gone', qty: 1, sortOrder: 0 }],
    };

    await service.generateInvoiceFromEstimate(estimate, 'c1');

    expect(service.customerInvoiceTaxRepository.createTax).not.toHaveBeenCalled();
  });

  it('creates the invoice with a null address when the estimate has no booking', async () => {
    const service = buildService({ created: { id: 'inv1' } });
    const estimate = { id: 'e1', bookingId: null, customerId: 'c1', status: 'sent', items: [] };

    await service.generateInvoiceFromEstimate(estimate, 'c1');

    expect(service.bookingRepository.findByPk).not.toHaveBeenCalled();
    expect(service.customerInvoiceRepository.createInvoice).toHaveBeenCalledWith(
      expect.objectContaining({ addressId: null }),
      expect.anything(),
    );
  });

  it('throws ConflictError (not a raw DB error) when createInvoice races past the findByEstimateId check', async () => {
    const service = buildService({ created: undefined });
    service.customerInvoiceRepository.createInvoice = jest.fn().mockRejectedValue(new UniqueConstraintError({}));
    const estimate = { id: 'e1', bookingId: 'b1', customerId: 'c1', status: 'sent', items: [] };

    await expect(service.generateInvoiceFromEstimate(estimate, 'c1')).rejects.toThrow(ConflictError);
  });

  it('re-throws unrelated errors from createInvoice unchanged', async () => {
    const service = buildService({ created: undefined });
    const dbError = new Error('connection lost');
    service.customerInvoiceRepository.createInvoice = jest.fn().mockRejectedValue(dbError);
    const estimate = { id: 'e1', bookingId: 'b1', customerId: 'c1', status: 'sent', items: [] };

    await expect(service.generateInvoiceFromEstimate(estimate, 'c1')).rejects.toBe(dbError);
  });
});
