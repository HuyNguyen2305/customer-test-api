import { BOOKING_GENERATION_WINDOW_DAYS } from '#constants/business-rules.js';
import { computeNextOccurrences } from './recurrence/recurrence-rule.util.js';

function addDaysToDate(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function addDuration(date, { lengthHours, lengthMinutes }) {
  const result = new Date(date);
  result.setHours(result.getHours() + (lengthHours || 0));
  result.setMinutes(result.getMinutes() + (lengthMinutes || 0));
  return result;
}

class RecurringBookingGeneratorService {
  constructor({ serviceRepository, serviceRecurrenceRepository, bookingRepository, jobSnapshotService }) {
    this.serviceRepository = serviceRepository;
    this.serviceRecurrenceRepository = serviceRecurrenceRepository;
    this.bookingRepository = bookingRepository;
    this.jobSnapshotService = jobSnapshotService;
  }

  async run({ now = new Date() } = {}) {
    const services = await this.serviceRepository.findActiveServicesWithRecurrence();
    const windowEnd = addDaysToDate(now, BOOKING_GENERATION_WINDOW_DAYS);
    const createdBookings = [];

    for (const service of services) {
      const recurrence = service.ServiceRecurrence;
      if (!recurrence || recurrence.repeatType === 'off') continue;

      const customerRows = await this.bookingRepository.findDistinctCustomersByService(service.id);
      for (const { customerId } of customerRows) {
        const latestBooking = await this.bookingRepository.findLatestByServiceAndCustomer(service.id, customerId);
        if (!latestBooking) continue;

        const candidates = computeNextOccurrences(recurrence, {
          anchorDate: latestBooking.startTime,
          windowStart: now,
          windowEnd,
        });

        for (const startTime of candidates) {
          const existing = await this.bookingRepository.findExistingOccurrence({
            serviceId: service.id,
            customerId,
            startTime,
          });
          if (existing) continue;

          const booking = await this.bookingRepository.createBooking({
            serviceId: service.id,
            customerId,
            addressId: latestBooking.addressId,
            startTime,
            endTime: addDuration(startTime, service),
            status: service.setToConfirmed ? 'confirmed' : 'pending',
          });

          await this.jobSnapshotService.createSnapshotForBooking(booking.id);
          createdBookings.push(booking);
        }
      }
    }

    return createdBookings;
  }
}

export default RecurringBookingGeneratorService;
