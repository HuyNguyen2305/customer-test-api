import { jest } from '@jest/globals';

const { default: InvoiceGenerationService } = await import('#service/invoice-generation.service.js');

function buildService({
  frequencies = [],
  invoicesBySourceId = {},
  createdInvoice,
  newBookings = [],
  bookingAlreadyInvoiced = {},
} = {}) {
  const service = Object.create(InvoiceGenerationService.prototype);
  service.invoiceFrequencyRepository = { findAllActiveRecurring: jest.fn().mockResolvedValue(frequencies) };
  service.customerInvoiceRepository = {
    findBySourceInvoiceId: jest.fn((sourceInvoiceId) => Promise.resolve(invoicesBySourceId[sourceInvoiceId] || [])),
    findByBookingId: jest.fn((bookingId) => Promise.resolve(bookingAlreadyInvoiced[bookingId] || null)),
    createInvoice: jest.fn().mockResolvedValue(createdInvoice || { id: 'new-invoice' }),
  };
  service.bookingRepository = { findCreatedSinceByService: jest.fn().mockResolvedValue(newBookings) };
  service.serviceInvoiceRepository = { findByServiceId: jest.fn() };
  return service;
}

describe('InvoiceGenerationService.processDueRecurrences', () => {
  it('skips frequencies with no invoice ever generated under that schedule', async () => {
    const service = buildService({
      frequencies: [{ serviceInvoiceId: 'si1', repeatType: 'monthly' }],
      invoicesBySourceId: {},
    });

    const result = await service.processDueRecurrences({ asOf: new Date('2026-02-01') });

    expect(result).toEqual([]);
    expect(service.customerInvoiceRepository.createInvoice).not.toHaveBeenCalled();
  });

  it('creates a follow-up invoice for a calendar-based frequency once the next period is due', async () => {
    const latestInvoice = { bookingId: 'b1', customerId: 'c1', createdAt: new Date('2026-01-01') };
    const service = buildService({
      frequencies: [{ serviceInvoiceId: 'si1', repeatType: 'monthly', interval: 1, repeatBy: 'day_of_month' }],
      invoicesBySourceId: { si1: [latestInvoice] },
    });

    const created = await service.processDueRecurrences({ asOf: new Date('2026-02-15') });

    expect(created).toHaveLength(1);
    expect(service.customerInvoiceRepository.createInvoice).toHaveBeenCalledWith({
      bookingId: 'b1',
      customerId: 'c1',
      sourceInvoiceId: 'si1',
      status: 'draft',
      balanceDue: 0,
    });
  });

  it('does not double-generate a follow-up invoice when run twice for the same period', async () => {
    const latestInvoice = { bookingId: 'b1', customerId: 'c1', createdAt: new Date('2026-01-01') };
    const service = buildService({
      frequencies: [{ serviceInvoiceId: 'si1', repeatType: 'monthly', interval: 1, repeatBy: 'day_of_month' }],
      invoicesBySourceId: { si1: [latestInvoice] },
    });
    const asOf = new Date('2026-01-15');

    const firstRun = await service.processDueRecurrences({ asOf });
    expect(firstRun).toEqual([]);

    const secondRun = await service.processDueRecurrences({ asOf });
    expect(secondRun).toEqual([]);
    expect(service.customerInvoiceRepository.createInvoice).not.toHaveBeenCalled();
  });

  it('skips does_not_repeat frequencies (excluded by findAllActiveRecurring)', async () => {
    const service = buildService({ frequencies: [] });

    const result = await service.processDueRecurrences({ asOf: new Date('2026-02-01') });

    expect(result).toEqual([]);
  });

  it('handles repeat_with_job by generating one follow-up invoice per new booking, skipping already-invoiced bookings', async () => {
    const latestInvoice = { bookingId: 'b1', customerId: 'c1', createdAt: new Date('2026-01-01') };
    const service = buildService({
      frequencies: [{ serviceInvoiceId: 'si1', repeatType: 'repeat_with_job', ServiceInvoice: { serviceId: 's1' } }],
      invoicesBySourceId: { si1: [latestInvoice] },
      newBookings: [
        { id: 'b2', customerId: 'c1' },
        { id: 'b3', customerId: 'c1' },
      ],
      bookingAlreadyInvoiced: { b3: { id: 'existing-invoice' } },
    });

    const created = await service.processDueRecurrences();

    expect(service.bookingRepository.findCreatedSinceByService).toHaveBeenCalledWith('s1', latestInvoice.createdAt);
    expect(service.customerInvoiceRepository.createInvoice).toHaveBeenCalledTimes(1);
    expect(service.customerInvoiceRepository.createInvoice).toHaveBeenCalledWith(
      expect.objectContaining({ bookingId: 'b2', sourceInvoiceId: 'si1' }),
    );
    expect(created).toHaveLength(1);
  });
});
