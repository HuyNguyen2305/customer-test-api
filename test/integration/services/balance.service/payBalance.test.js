import { jest } from '@jest/globals';
import { seedWithTransaction } from '../../../helpers/seed-fixtures.js';
import balanceFixtures from '../../../fixtures/balance.fixtures.cjs';
import customerPaymentMethodFixtures from '../../../fixtures/customer-payment-method.fixtures.cjs';

const chargeMock = jest.fn();

jest.unstable_mockModule('#common/factory/payment-gateway/payment-gateway.factory.js', () => ({
  getPaymentGateway: jest.fn(() => ({ charge: chargeMock })),
}));

const { default: BalanceService } = await import('#service/balance.service.js');
const { default: BalanceRepository } = await import('#repositories/balance.repository.js');
const { default: CustomerPaymentMethodRepository } =
  await import('#repositories/customer-payment-method.repository.js');
const { default: LedgerService } = await import('#service/ledger.service.js');
const { default: CustomerLedgerEntryRepository } = await import('#repositories/customer-ledger-entry.repository.js');
const models = (await import('#models/index.js')).default;

function buildService() {
  const balanceRepository = Object.create(BalanceRepository.prototype);
  balanceRepository.model = models.Balance;
  const customerPaymentMethodRepository = Object.create(CustomerPaymentMethodRepository.prototype);
  customerPaymentMethodRepository.model = models.CustomerPaymentMethod;
  const customerLedgerEntryRepository = Object.create(CustomerLedgerEntryRepository.prototype);
  customerLedgerEntryRepository.model = models.CustomerLedgerEntry;

  const ledgerService = Object.create(LedgerService.prototype);
  ledgerService.customerLedgerEntryRepository = customerLedgerEntryRepository;

  const service = Object.create(BalanceService.prototype);
  service.balanceRepository = balanceRepository;
  service.customerPaymentMethodRepository = customerPaymentMethodRepository;
  service.ledgerService = ledgerService;
  return service;
}

describe('BalanceService.payBalance (integration)', () => {
  beforeEach(() => chargeMock.mockReset().mockResolvedValue({ success: true }));

  it('charges the gateway, records a ledger payment, and reconciles the balance to 0', async () => {
    await seedWithTransaction(
      {
        Customer: [{ id: balanceFixtures.balanceWithAmount.customerId }],
        Balance: [balanceFixtures.balanceWithAmount],
        CustomerPaymentMethod: [customerPaymentMethodFixtures.squareCard],
        // A prior 'charge' entry matching the balance, so the ledger nets to 0 after
        // payment — recordInvoiceCharge itself has no caller yet in production code
        // (a separate, pre-existing gap), so this stands in for that missing wiring.
        CustomerLedgerEntry: [
          {
            customerId: balanceFixtures.balanceWithAmount.customerId,
            type: 'charge',
            amount: balanceFixtures.balanceWithAmount.amount,
          },
        ],
      },
      async ({ seeded }) => {
        const service = buildService();
        const paymentMethodId = seeded.CustomerPaymentMethod[0].id;

        const result = await service.payBalance(balanceFixtures.balanceWithAmount.customerId, paymentMethodId);

        expect(chargeMock).toHaveBeenCalledWith({
          amount: balanceFixtures.balanceWithAmount.amount,
          currency: balanceFixtures.balanceWithAmount.currency,
          sourceId: customerPaymentMethodFixtures.squareCard.paymentDetails.token,
          customerId: customerPaymentMethodFixtures.squareCard.paymentDetails.gatewayCustomerId,
          type: customerPaymentMethodFixtures.squareCard.type,
          idempotencyKey: expect.any(String),
        });
        expect(Number(result.amount)).toBe(0);

        const ledgerBalance = await service.ledgerService.getCustomerBalance(
          balanceFixtures.balanceWithAmount.customerId,
        );
        expect(ledgerBalance).toBe(0);
      },
    );
  });

  it('pays via open credit without calling any gateway', async () => {
    await seedWithTransaction(
      {
        Customer: [{ id: balanceFixtures.balanceWithAmount.customerId }],
        Balance: [balanceFixtures.balanceWithAmount],
        CustomerPaymentMethod: [customerPaymentMethodFixtures.openCredit],
        CustomerLedgerEntry: [
          {
            customerId: balanceFixtures.balanceWithAmount.customerId,
            type: 'charge',
            amount: balanceFixtures.balanceWithAmount.amount,
          },
        ],
      },
      async ({ seeded }) => {
        const service = buildService();
        const paymentMethodId = seeded.CustomerPaymentMethod[0].id;

        const result = await service.payBalance(balanceFixtures.balanceWithAmount.customerId, paymentMethodId);

        expect(chargeMock).not.toHaveBeenCalled();
        expect(Number(result.amount)).toBe(0);
      },
    );
  });

  it('rolls back the credit decrement when a later write in the same transaction fails', async () => {
    await seedWithTransaction(
      {
        Customer: [{ id: balanceFixtures.balanceWithAmount.customerId }],
        Balance: [balanceFixtures.balanceWithAmount],
        CustomerPaymentMethod: [customerPaymentMethodFixtures.openCredit],
        CustomerLedgerEntry: [
          {
            customerId: balanceFixtures.balanceWithAmount.customerId,
            type: 'charge',
            amount: balanceFixtures.balanceWithAmount.amount,
          },
        ],
      },
      async ({ seeded }) => {
        const service = buildService();
        const paymentMethodId = seeded.CustomerPaymentMethod[0].id;
        const originalCreditBalance = Number(seeded.CustomerPaymentMethod[0].paymentDetails.creditBalance);

        // Force the ledger write inside the transaction to fail, after
        // decrementCredit has already run - proves the credit decrement
        // rolls back with it instead of committing independently.
        const recordPaymentSpy = jest
          .spyOn(service.ledgerService, 'recordPayment')
          .mockRejectedValueOnce(new Error('simulated ledger failure'));

        await expect(service.payBalance(balanceFixtures.balanceWithAmount.customerId, paymentMethodId)).rejects.toThrow(
          'simulated ledger failure',
        );

        recordPaymentSpy.mockRestore();

        const paymentMethodAfter = await service.customerPaymentMethodRepository.getPaymentMethodById(
          paymentMethodId,
          balanceFixtures.balanceWithAmount.customerId,
        );
        expect(Number(paymentMethodAfter.paymentDetails.creditBalance)).toBe(originalCreditBalance);
      },
    );
  });
});
