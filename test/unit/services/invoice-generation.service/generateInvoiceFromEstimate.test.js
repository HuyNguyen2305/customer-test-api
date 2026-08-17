import { jest } from '@jest/globals';

const { default: InvoiceGenerationService } = await import('#service/invoice-generation.service.js');
const { ConflictError } = await import('#configs/error.js');
const { UniqueConstraintError } = await import('sequelize');

function buildService({ existingInvoice = null, booking = null, created, invoiceItems = [] } = {}) {
  const service = Object.create(InvoiceGenerationService.prototype);
  service.bookingRepository = { findByPk: jest.fn().mockResolvedValue(booking) };
  service.customerInvoiceRepository = {
    findByEstimateId: jest.fn().mockResolvedValue(existingInvoice),
    createInvoice: jest.fn().mockResolvedValue(created),
  };
  service.addressRepository = { getByIdForCustomer: jest.fn().mockResolvedValue(null) };
  service.customerInvoiceItemRepository = {
    bulkCreateItems: jest.fn().mockResolvedValue([]),
    listByInvoiceId: jest.fn().mockResolvedValue(invoiceItems),
    updateMany: jest.fn().mockResolvedValue(undefined),
  };
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

  it('copies estimate items onto the invoice, carrying their already-resolved tax1/tax2 snapshot straight through', async () => {
    const created = { id: 'inv1' };
    const service = buildService({ created });
    const estimate = {
      id: 'e1',
      bookingId: 'b1',
      customerId: 'c1',
      status: 'sent',
      items: [
        {
          itemId: 'item1',
          description: 'Treatment',
          cost: 80,
          qty: 1,
          sortOrder: 0,
          tax1RateId: 'tax1',
          tax1Name: 'NY Sales Tax',
          tax1Rate: 4,
          tax2RateId: null,
          tax2Name: null,
          tax2Rate: null,
        },
      ],
    };

    await service.generateInvoiceFromEstimate(estimate, 'c1');

    expect(service.customerInvoiceItemRepository.bulkCreateItems).toHaveBeenCalledWith(
      [
        {
          customerInvoiceId: 'inv1',
          itemId: 'item1',
          description: 'Treatment',
          cost: 80,
          qty: 1,
          sortOrder: 0,
          tax1RateId: 'tax1',
          tax1Name: 'NY Sales Tax',
          tax1Rate: 4,
          tax2RateId: null,
          tax2Name: null,
          tax2Rate: null,
        },
      ],
      expect.anything(),
    );
  });

  it('recomputes the invoice items after copying, so subtotal/tax/total columns are filled in from the invoice items table', async () => {
    const created = { id: 'inv1', discountValue: 0, discountType: 'flat' };
    const copiedItems = [{ id: 'ii1', cost: 80, qty: 1, tax1Rate: 4 }];
    const service = buildService({ created, invoiceItems: copiedItems });
    const estimate = {
      id: 'e1',
      bookingId: 'b1',
      customerId: 'c1',
      status: 'sent',
      items: [
        {
          itemId: 'item1',
          description: 'A',
          cost: 80,
          qty: 1,
          sortOrder: 0,
          tax1RateId: 'tax1',
          tax1Name: 'NY',
          tax1Rate: 4,
        },
      ],
    };

    await service.generateInvoiceFromEstimate(estimate, 'c1');

    expect(service.customerInvoiceItemRepository.listByInvoiceId).toHaveBeenCalledWith('inv1', expect.anything());
    const [patches] = service.customerInvoiceItemRepository.updateMany.mock.calls[0];
    expect(patches).toEqual([expect.objectContaining({ id: 'ii1', tax1Total: 3.2, total: 83.2 })]);
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
