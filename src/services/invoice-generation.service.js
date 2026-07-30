import { ConflictError, NotFoundError } from '#configs/error.js';
import { computeNextOccurrences } from './recurrence/recurrence-rule.util.js';

class InvoiceGenerationService {
  constructor({ bookingRepository, customerInvoiceRepository, invoiceFrequencyRepository, serviceInvoiceRepository }) {
    this.bookingRepository = bookingRepository;
    this.customerInvoiceRepository = customerInvoiceRepository;
    this.invoiceFrequencyRepository = invoiceFrequencyRepository;
    this.serviceInvoiceRepository = serviceInvoiceRepository;
  }

  async generateInitialInvoice(bookingId) {
    const booking = await this.bookingRepository.findByPk(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

    const existingInvoice = await this.customerInvoiceRepository.findByBookingId(bookingId);
    if (existingInvoice) throw new ConflictError('Invoice already exists for this booking');

    const serviceInvoice = await this.serviceInvoiceRepository.findByServiceId(booking.serviceId);

    return this.customerInvoiceRepository.createInvoice({
      bookingId,
      customerId: booking.customerId,
      sourceInvoiceId: serviceInvoice ? serviceInvoice.id : null,
      status: 'draft',
      balanceDue: 0,
    });
  }

  async processDueRecurrences({ asOf = new Date() } = {}) {
    const frequencies = await this.invoiceFrequencyRepository.findAllActiveRecurring();
    const createdInvoices = [];

    for (const frequency of frequencies) {
      const existingInvoices = await this.customerInvoiceRepository.findBySourceInvoiceId(frequency.serviceInvoiceId);
      if (!existingInvoices.length) continue;

      const latestInvoice = existingInvoices[0];

      if (frequency.repeatType === 'repeat_with_job') {
        const serviceInvoice = frequency.ServiceInvoice;
        if (!serviceInvoice) continue;

        const newBookings = await this.bookingRepository.findCreatedSinceByService(
          serviceInvoice.serviceId,
          latestInvoice.createdAt,
        );

        for (const booking of newBookings) {
          const alreadyInvoiced = await this.customerInvoiceRepository.findByBookingId(booking.id);
          if (alreadyInvoiced) continue;

          const invoice = await this.customerInvoiceRepository.createInvoice({
            bookingId: booking.id,
            customerId: booking.customerId,
            sourceInvoiceId: frequency.serviceInvoiceId,
            status: 'draft',
            balanceDue: 0,
          });
          createdInvoices.push(invoice);
        }
        continue;
      }

      const [nextDue] = computeNextOccurrences(frequency, {
        anchorDate: latestInvoice.createdAt,
        windowStart: latestInvoice.createdAt,
        windowEnd: asOf,
      });
      if (!nextDue) continue;

      const invoice = await this.customerInvoiceRepository.createInvoice({
        bookingId: latestInvoice.bookingId,
        customerId: latestInvoice.customerId,
        sourceInvoiceId: frequency.serviceInvoiceId,
        status: 'draft',
        balanceDue: 0,
      });
      createdInvoices.push(invoice);
    }

    return createdInvoices;
  }
}

export default InvoiceGenerationService;
