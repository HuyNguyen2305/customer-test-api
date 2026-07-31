import { seedWithTransaction } from '../../../helpers/seed-fixtures.js';
import fixtures from '../../../fixtures/customer-portal.fixtures.cjs';

const { default: CustomerLedgerEntryRepository } = await import('#repositories/customer-ledger-entry.repository.js');
const models = (await import('#models/index.js')).default;

const { customerA, service1, bookingA, invoiceA } = fixtures;

const seedFixtures = {
  Customer: [customerA],
  Service: [service1],
  Booking: [bookingA],
  CustomerInvoice: [invoiceA],
};

describe('CustomerLedgerEntryRepository.createEntry (integration)', () => {
  it('succeeds when referenceId points at a real customer_invoices row', async () => {
    await seedWithTransaction(seedFixtures, async () => {
      const repository = Object.create(CustomerLedgerEntryRepository.prototype);
      repository.model = models.CustomerLedgerEntry;

      const entry = await repository.createEntry({
        customerId: customerA.id,
        type: 'charge',
        amount: 100,
        referenceId: invoiceA.id,
      });

      expect(entry.referenceId).toBe(invoiceA.id);
    });
  });

  it('is rejected by the database when referenceId points at a nonexistent invoice', async () => {
    await seedWithTransaction(seedFixtures, async () => {
      const repository = Object.create(CustomerLedgerEntryRepository.prototype);
      repository.model = models.CustomerLedgerEntry;

      await expect(
        repository.createEntry({
          customerId: customerA.id,
          type: 'charge',
          amount: 100,
          referenceId: '99999999-9999-9999-9999-999999999999',
        }),
      ).rejects.toThrow();
    });
  });
});
