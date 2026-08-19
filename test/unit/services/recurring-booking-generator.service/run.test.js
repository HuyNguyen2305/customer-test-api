import { jest } from '@jest/globals';

const { default: RecurringBookingGeneratorService } = await import('#service/recurring-booking-generator.service.js');

function buildService({
  services = [],
  customersByService = {},
  latestBookingByCustomer = {},
  existingByKey = {},
} = {}) {
  const service = Object.create(RecurringBookingGeneratorService.prototype);
  service.serviceRepository = { findActiveServicesWithRecurrence: jest.fn().mockResolvedValue(services) };
  service.bookingRepository = {
    findDistinctCustomersByService: jest.fn((serviceId) => Promise.resolve(customersByService[serviceId] || [])),
    findLatestByServiceAndCustomer: jest.fn((serviceId, customerId) =>
      Promise.resolve(latestBookingByCustomer[`${serviceId}:${customerId}`] || null),
    ),
    findExistingOccurrence: jest.fn(({ serviceId, customerId, startTime }) =>
      Promise.resolve(existingByKey[`${serviceId}:${customerId}:${startTime.toISOString()}`] || null),
    ),
    createBooking: jest.fn((data) => Promise.resolve({ id: `booking-${Math.random()}`, ...data })),
  };
  service.jobSnapshotService = { createSnapshotForBooking: jest.fn().mockResolvedValue(undefined) };
  return service;
}

describe('RecurringBookingGeneratorService.run', () => {
  it('skips services whose recurrence repeatType is off', async () => {
    const service = buildService({
      services: [
        { id: 's1', ServiceRecurrence: { recurrenceRule: { repeatType: 'off' } }, lengthHours: 1, lengthMinutes: 0 },
      ],
    });

    const result = await service.run({ now: new Date('2026-01-01') });

    expect(result).toEqual([]);
    expect(service.bookingRepository.findDistinctCustomersByService).not.toHaveBeenCalled();
  });

  it('generates bookings within the window anchored on the latest existing booking, and snapshots each', async () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const latestBooking = { startTime: new Date('2026-01-01T00:00:00Z'), addressId: 'addr1' };
    const service = buildService({
      services: [
        {
          id: 's1',
          ServiceRecurrence: { recurrenceRule: { repeatType: 'daily', interval: 1 } },
          lengthHours: 1,
          lengthMinutes: 30,
          setToConfirmed: false,
        },
      ],
      customersByService: { s1: [{ customerId: 'c1' }] },
      latestBookingByCustomer: { 's1:c1': latestBooking },
    });

    const created = await service.run({ now });

    expect(created.length).toBeGreaterThan(0);
    expect(service.bookingRepository.createBooking).toHaveBeenCalledWith(
      expect.objectContaining({ serviceId: 's1', customerId: 'c1', addressId: 'addr1', status: 'pending' }),
    );
    expect(service.jobSnapshotService.createSnapshotForBooking).toHaveBeenCalledTimes(created.length);
  });

  it('is idempotent: running twice does not create duplicate bookings for the same occurrence', async () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const latestBooking = { startTime: new Date('2026-01-01T00:00:00Z'), addressId: 'addr1' };
    const existingByKey = {};
    const service = buildService({
      services: [
        {
          id: 's1',
          ServiceRecurrence: { recurrenceRule: { repeatType: 'daily', interval: 1 } },
          lengthHours: 1,
          lengthMinutes: 0,
        },
      ],
      customersByService: { s1: [{ customerId: 'c1' }] },
      latestBookingByCustomer: { 's1:c1': latestBooking },
      existingByKey,
    });

    const firstRun = await service.run({ now });
    expect(firstRun.length).toBeGreaterThan(0);

    for (const booking of firstRun) {
      existingByKey[`s1:c1:${booking.startTime.toISOString()}`] = booking;
    }
    service.bookingRepository.createBooking.mockClear();

    const secondRun = await service.run({ now });

    expect(secondRun).toEqual([]);
    expect(service.bookingRepository.createBooking).not.toHaveBeenCalled();
  });

  it('skips customers with no prior booking for the service', async () => {
    const service = buildService({
      services: [
        {
          id: 's1',
          ServiceRecurrence: { recurrenceRule: { repeatType: 'daily', interval: 1 } },
          lengthHours: 1,
          lengthMinutes: 0,
        },
      ],
      customersByService: { s1: [{ customerId: 'c1' }] },
      latestBookingByCustomer: {},
    });

    const result = await service.run({ now: new Date('2026-01-01') });

    expect(result).toEqual([]);
    expect(service.bookingRepository.createBooking).not.toHaveBeenCalled();
  });
});
