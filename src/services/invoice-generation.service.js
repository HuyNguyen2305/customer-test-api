import { UniqueConstraintError } from 'sequelize';

import { ConflictError, NotFoundError } from '#configs/error.js';
import { computeNextOccurrences } from './recurrence/recurrence-rule.util.js';

class InvoiceGenerationService {
  constructor({
    bookingRepository,
    customerInvoiceRepository,
    invoiceFrequencyRepository,
    serviceInvoiceRepository,
    addressRepository,
    invoiceItemRepository,
    customerInvoiceItemRepository,
    taxRateRepository,
    customerInvoiceTaxRepository,
  }) {
    this.bookingRepository = bookingRepository;
    this.customerInvoiceRepository = customerInvoiceRepository;
    this.invoiceFrequencyRepository = invoiceFrequencyRepository;
    this.serviceInvoiceRepository = serviceInvoiceRepository;
    this.addressRepository = addressRepository;
    this.invoiceItemRepository = invoiceItemRepository;
    this.customerInvoiceItemRepository = customerInvoiceItemRepository;
    this.taxRateRepository = taxRateRepository;
    this.customerInvoiceTaxRepository = customerInvoiceTaxRepository;
  }

  // Copies the booking's address onto the invoice at generation time, frozen from
  // that point on — editing the saved address later must not change how past
  // invoices display (same rationale as the tax-rate snapshot on CustomerInvoiceTax).
  async buildAddressSnapshot(booking) {
    if (!booking.addressId) return { addressId: null };

    const address = await this.addressRepository.getByIdForCustomer(booking.addressId, booking.customerId);
    if (!address) return { addressId: null };

    return {
      addressId: address.id,
      addressLabel: address.label,
      addressLine1: address.line1,
      addressLine2: address.line2,
      addressCity: address.city,
      addressState: address.state,
      addressZip: address.zip,
      addressCountry: address.country,
    };
  }

  // Copies the template's InvoiceItem rows onto the newly created invoice — a
  // generated invoice otherwise has no line items at all.
  async copyLineItems(invoice, sourceInvoiceId) {
    if (!sourceInvoiceId) return;

    const templateItems = await this.invoiceItemRepository.listByServiceInvoiceId(sourceInvoiceId);
    if (!templateItems.length) return;

    await this.customerInvoiceItemRepository.bulkCreateItems(
      templateItems.map((item) => ({
        customerInvoiceId: invoice.id,
        itemId: item.itemId,
        description: item.description,
        cost: item.cost,
        qty: item.qty,
        sortOrder: item.sortOrder,
      })),
    );
  }

  // Matches the invoice's snapshotted state to a seeded TaxRate and freezes a
  // CustomerInvoiceTax row from it — same rationale as the address snapshot: a
  // later edit to the master TaxRate must not retroactively change this invoice.
  async attachAutoTax(invoice, addressSnapshot) {
    const state = addressSnapshot?.addressState;
    if (!state) return;

    const taxRate = await this.taxRateRepository.findByState(state);
    if (!taxRate) return;

    await this.customerInvoiceTaxRepository.createTax({
      customerInvoiceId: invoice.id,
      taxRateId: taxRate.id,
      name: taxRate.name,
      code: taxRate.code,
      rate: taxRate.rate,
      type: taxRate.type,
    });
  }

  async generateInitialInvoice(bookingId) {
    const booking = await this.bookingRepository.findByPk(bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

    const existingInvoice = await this.customerInvoiceRepository.findByBookingId(bookingId);
    if (existingInvoice) throw new ConflictError('Invoice already exists for this booking');

    const serviceInvoice = await this.serviceInvoiceRepository.findByServiceId(booking.serviceId);
    const addressSnapshot = await this.buildAddressSnapshot(booking);

    try {
      const sourceInvoiceId = serviceInvoice ? serviceInvoice.id : null;
      const invoice = await this.customerInvoiceRepository.createInvoice({
        bookingId,
        customerId: booking.customerId,
        sourceInvoiceId,
        status: 'draft',
        balanceDue: 0,
        isInitial: true,
        ...addressSnapshot,
      });
      await this.copyLineItems(invoice, sourceInvoiceId);
      await this.attachAutoTax(invoice, addressSnapshot);
      return invoice;
    } catch (error) {
      // The findByBookingId check above has a race window under concurrent calls
      // for the same booking; the partial unique index on (bookingId) WHERE
      // isInitial = true is the actual source of truth.
      if (error instanceof UniqueConstraintError) {
        throw new ConflictError('Invoice already exists for this booking');
      }
      throw error;
    }
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

          const addressSnapshot = await this.buildAddressSnapshot(booking);
          const invoice = await this.customerInvoiceRepository.createInvoice({
            bookingId: booking.id,
            customerId: booking.customerId,
            sourceInvoiceId: frequency.serviceInvoiceId,
            status: 'draft',
            balanceDue: 0,
            ...addressSnapshot,
          });
          await this.copyLineItems(invoice, frequency.serviceInvoiceId);
          await this.attachAutoTax(invoice, addressSnapshot);
          createdInvoices.push(invoice);
        }
        continue;
      }

      const dueDates = computeNextOccurrences(frequency, {
        anchorDate: latestInvoice.createdAt,
        windowStart: latestInvoice.createdAt,
        windowEnd: asOf,
      });

      const recurringBooking = await this.bookingRepository.findByPk(latestInvoice.bookingId);
      const addressSnapshot = recurringBooking
        ? await this.buildAddressSnapshot(recurringBooking)
        : { addressId: null };

      // Generate one invoice per overdue occurrence, not just the first, so a
      // generation run that missed its schedule (e.g. a monthly job that didn't
      // run for three months) catches up instead of silently losing periods.
      for (let i = 0; i < dueDates.length; i += 1) {
        const invoice = await this.customerInvoiceRepository.createInvoice({
          bookingId: latestInvoice.bookingId,
          customerId: latestInvoice.customerId,
          sourceInvoiceId: frequency.serviceInvoiceId,
          status: 'draft',
          balanceDue: 0,
          ...addressSnapshot,
        });
        await this.copyLineItems(invoice, frequency.serviceInvoiceId);
        await this.attachAutoTax(invoice, addressSnapshot);
        createdInvoices.push(invoice);
      }
    }

    return createdInvoices;
  }
}

export default InvoiceGenerationService;
