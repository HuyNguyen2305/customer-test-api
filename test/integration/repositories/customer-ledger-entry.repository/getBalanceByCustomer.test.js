import { seedWithTransaction } from '../../../helpers/seed-fixtures.js';
import fixtures from '../../../fixtures/customer-portal.fixtures.cjs';

const { default: CustomerLedgerEntryRepository } = await import('#repositories/customer-ledger-entry.repository.js');
const models = (await import('#models/index.js')).default;

const { customerA, service1, bookingA } = fixtures;

const seedFixtures = {
  Customer: [customerA],
  Service: [service1],
  Booking: [bookingA],
};

function buildRepository() {
  const repository = Object.create(CustomerLedgerEntryRepository.prototype);
  repository.model = models.CustomerLedgerEntry;
  return repository;
}

describe('CustomerLedgerEntryRepository.getBalanceByCustomer (integration)', () => {
  it('adds charge and adjustment entries, subtracts payment and refund entries', async () => {
    await seedWithTransaction(
      {
        ...seedFixtures,
        CustomerLedgerEntry: [
          { customerId: customerA.id, type: 'charge', amount: 100 },
          { customerId: customerA.id, type: 'adjustment', amount: 20 },
          { customerId: customerA.id, type: 'payment', amount: 40 },
          { customerId: customerA.id, type: 'refund', amount: 10 },
        ],
      },
      async () => {
        const repository = buildRepository();

        // 100 + 20 - 40 - 10 = 70
        const balance = await repository.getBalanceByCustomer(customerA.id);

        expect(balance).toBe(70);
      },
    );
  });

  it('returns 0 for a customer with no ledger entries', async () => {
    await seedWithTransaction(seedFixtures, async () => {
      const repository = buildRepository();

      const balance = await repository.getBalanceByCustomer(customerA.id);

      expect(balance).toBe(0);
    });
  });
});
