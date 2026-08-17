import { jest } from '@jest/globals';

const { default: InvoiceGenerationService } = await import('#service/invoice-generation.service.js');
const { ConflictError, NotFoundError } = await import('#configs/error.js');
const { UniqueConstraintError } = await import('sequelize');

function buildService({ booking, existingInvoice, serviceInvoice, created } = {}) {
  const service = Object.create(InvoiceGenerationService.prototype);
  service.bookingRepository = { findByPk: jest.fn().mockResolvedValue(booking) };
  service.customerInvoiceRepository = {
    findByBookingId: jest.fn().mockResolvedValue(existingInvoice),
    createInvoice: jest.fn().mockResolvedValue(created),
  };
  service.serviceInvoiceRepository = { findByServiceId: jest.fn().mockResolvedValue(serviceInvoice) };
  service.addressRepository = { getByIdForCustomer: jest.fn().mockResolvedValue(null) };
  service.invoiceItemRepository = { listByServiceInvoiceId: jest.fn().mockResolvedValue([]) };
  service.customerInvoiceItemRepository = {
    bulkCreateItems: jest.fn().mockResolvedValue([]),
    listByInvoiceId: jest.fn().mockResolvedValue([]),
    updateMany: jest.fn().mockResolvedValue(undefined),
  };
  service.taxRateRepository = { findByState: jest.fn().mockResolvedValue(null) };
  return service;
}

describe('InvoiceGenerationService.generateInitialInvoice', () => {
  it('throws NotFoundError when the booking does not exist', async () => {
    const service = buildService({ booking: null });

    await expect(service.generateInitialInvoice('missing')).rejects.toThrow(NotFoundError);
  });

  it('throws ConflictError when an invoice already exists for the booking (idempotency)', async () => {
    const booking = { id: 'b1', customerId: 'c1', serviceId: 's1' };
    const service = buildService({ booking, existingInvoice: { id: 'existing' } });

    await expect(service.generateInitialInvoice('b1')).rejects.toThrow(ConflictError);
    expect(service.customerInvoiceRepository.createInvoice).not.toHaveBeenCalled();
  });

  it('creates a draft invoice linked to the service invoice template when one exists', async () => {
    const booking = { id: 'b1', customerId: 'c1', serviceId: 's1' };
    const serviceInvoice = { id: 'si1' };
    const created = { id: 'inv1' };
    const service = buildService({ booking, existingInvoice: null, serviceInvoice, created });

    const result = await service.generateInitialInvoice('b1');

    expect(service.customerInvoiceRepository.createInvoice).toHaveBeenCalledWith(
      {
        bookingId: 'b1',
        customerId: 'c1',
        sourceInvoiceId: 'si1',
        status: 'draft',
        balanceDue: 0,
        isInitial: true,
        addressId: null,
      },
      expect.anything(),
    );
    expect(result).toBe(created);
  });

  it('creates a draft invoice with sourceInvoiceId null when the service has no invoice template', async () => {
    const booking = { id: 'b1', customerId: 'c1', serviceId: 's1' };
    const service = buildService({ booking, existingInvoice: null, serviceInvoice: null, created: { id: 'inv1' } });

    await service.generateInitialInvoice('b1');

    expect(service.customerInvoiceRepository.createInvoice).toHaveBeenCalledWith(
      expect.objectContaining({ sourceInvoiceId: null, isInitial: true, addressId: null }),
      expect.anything(),
    );
  });

  it('throws ConflictError (not a raw DB error) when createInvoice races past the findByBookingId check', async () => {
    const booking = { id: 'b1', customerId: 'c1', serviceId: 's1' };
    const service = buildService({ booking, existingInvoice: null, serviceInvoice: null });
    service.customerInvoiceRepository.createInvoice = jest.fn().mockRejectedValue(new UniqueConstraintError({}));

    await expect(service.generateInitialInvoice('b1')).rejects.toThrow(ConflictError);
  });

  it('re-throws unrelated errors from createInvoice unchanged', async () => {
    const booking = { id: 'b1', customerId: 'c1', serviceId: 's1' };
    const dbError = new Error('connection lost');
    const service = buildService({ booking, existingInvoice: null, serviceInvoice: null });
    service.customerInvoiceRepository.createInvoice = jest.fn().mockRejectedValue(dbError);

    await expect(service.generateInitialInvoice('b1')).rejects.toBe(dbError);
  });
});
