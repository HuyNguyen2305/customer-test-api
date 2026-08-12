import { UniqueConstraintError } from 'sequelize';

import { sequelize } from '#common/sequelize.js';
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
    customerEstimateRepository,
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
    this.customerEstimateRepository = customerEstimateRepository;
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
  async copyLineItems(invoice, sourceInvoiceId, options = {}) {
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
      options,
    );
  }

  // Matches the invoice's snapshotted state to a seeded TaxRate and freezes a
  // CustomerInvoiceTax row from it — same rationale as the address snapshot: a
  // later edit to the master TaxRate must not retroactively change this invoice.
  async attachAutoTax(invoice, addressSnapshot, options = {}) {
    const state = addressSnapshot?.addressState;
    if (!state) return;

    const taxRate = await this.taxRateRepository.findByState(state);
    if (!taxRate) return;

    await this.customerInvoiceTaxRepository.createTax(
      {
        customerInvoiceId: invoice.id,
        taxRateId: taxRate.id,
        name: taxRate.name,
        code: taxRate.code,
        rate: taxRate.rate,
        type: taxRate.type,
      },
      options,
    );
  }

  // Creates the invoice plus its line items and auto-tax as one atomic unit —
  // without this, a failure partway through (e.g. copyLineItems throwing)
  // would leave a committed invoice with no items/tax, and the idempotency
  // check on bookingId would then block ever regenerating it correctly.
  async createInvoiceWithItemsAndTax(invoiceData, sourceInvoiceId, addressSnapshot) {
    return sequelize.transaction(async (transaction) => {
      const invoice = await this.customerInvoiceRepository.createInvoice(invoiceData, { transaction });
      await this.copyLineItems(invoice, sourceInvoiceId, { transaction });
      await this.attachAutoTax(invoice, addressSnapshot, { transaction });
      return invoice;
    });
  }

  // Copies the source estimate's items onto the newly created invoice.
  // CustomerInvoiceItem has no taxRateId column (invoice tax is invoice-level,
  // not per-line), so that field is intentionally dropped here.
  async copyEstimateLineItems(invoice, items, options = {}) {
    if (!items?.length) return;

    await this.customerInvoiceItemRepository.bulkCreateItems(
      items.map((item) => ({
        customerInvoiceId: invoice.id,
        itemId: item.itemId,
        description: item.description,
        cost: item.cost,
        qty: item.qty,
        sortOrder: item.sortOrder,
      })),
      options,
    );
  }

  // Freezes one CustomerInvoiceTax row per distinct taxRateId referenced by the
  // source estimate's items — same snapshot rationale as attachAutoTax, just
  // sourced from the estimate's own per-line tax rates instead of an
  // address-state lookup.
  async attachEstimateTaxes(invoice, items, options = {}) {
    const taxRateIds = [...new Set((items ?? []).map((item) => item.taxRateId).filter(Boolean))];

    for (const taxRateId of taxRateIds) {
      const taxRate = await this.taxRateRepository.findByPk(taxRateId);
      if (!taxRate) continue;

      await this.customerInvoiceTaxRepository.createTax(
        {
          customerInvoiceId: invoice.id,
          taxRateId: taxRate.id,
          name: taxRate.name,
          code: taxRate.code,
          rate: taxRate.rate,
          type: taxRate.type,
        },
        options,
      );
    }
  }

  // Creates an invoice from a CustomerEstimate: the estimate's fields/items/
  // per-item tax rates are snapshotted onto a new draft invoice, and — since
  // this is the only status-mutating action on estimates today — the estimate
  // is advanced to 'approved' in the same transaction, effectively locking it.
  async generateInvoiceFromEstimate(estimate, customerId) {
    const existingInvoice = await this.customerInvoiceRepository.findByEstimateId(estimate.id);
    if (existingInvoice) throw new ConflictError('Invoice already exists for this estimate');

    const booking = estimate.bookingId ? await this.bookingRepository.findByPk(estimate.bookingId) : null;
    const addressSnapshot = booking ? await this.buildAddressSnapshot(booking) : { addressId: null };

    try {
      return await sequelize.transaction(async (transaction) => {
        const invoice = await this.customerInvoiceRepository.createInvoice(
          {
            bookingId: estimate.bookingId,
            customerId,
            estimateId: estimate.id,
            status: 'draft',
            balanceDue: 0,
            discountValue: estimate.discountValue,
            discountType: estimate.discountType,
            termsText: estimate.termsText,
            notesText: estimate.notesText,
            ...addressSnapshot,
          },
          { transaction },
        );
        await this.copyEstimateLineItems(invoice, estimate.items, { transaction });
        await this.attachEstimateTaxes(invoice, estimate.items, { transaction });

        if (estimate.status !== 'approved') {
          await this.customerEstimateRepository.updateStatus(estimate.id, customerId, 'approved', { transaction });
        }

        return invoice;
      });
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new ConflictError('Invoice already exists for this estimate');
      }
      throw error;
    }
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
      return await this.createInvoiceWithItemsAndTax(
        {
          bookingId,
          customerId: booking.customerId,
          sourceInvoiceId,
          status: 'draft',
          balanceDue: 0,
          isInitial: true,
          ...addressSnapshot,
        },
        sourceInvoiceId,
        addressSnapshot,
      );
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
          const invoice = await this.createInvoiceWithItemsAndTax(
            {
              bookingId: booking.id,
              customerId: booking.customerId,
              sourceInvoiceId: frequency.serviceInvoiceId,
              status: 'draft',
              balanceDue: 0,
              ...addressSnapshot,
            },
            frequency.serviceInvoiceId,
            addressSnapshot,
          );
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
        const invoice = await this.createInvoiceWithItemsAndTax(
          {
            bookingId: latestInvoice.bookingId,
            customerId: latestInvoice.customerId,
            sourceInvoiceId: frequency.serviceInvoiceId,
            status: 'draft',
            balanceDue: 0,
            ...addressSnapshot,
          },
          frequency.serviceInvoiceId,
          addressSnapshot,
        );
        createdInvoices.push(invoice);
      }
    }

    return createdInvoices;
  }
}

export default InvoiceGenerationService;
