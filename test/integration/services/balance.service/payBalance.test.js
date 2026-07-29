import { jest } from '@jest/globals';
import { seedWithTransaction } from '../../../helpers/seed-fixtures.js';
import balanceFixtures from '../../../fixtures/balance.fixtures.cjs';
import paymentOptionFixtures from '../../../fixtures/payment-option.fixtures.cjs';

const chargeMock = jest.fn();

jest.unstable_mockModule('#common/factory/payment-gateway/payment-gateway.factory.js', () => ({
  getPaymentGateway: jest.fn(() => ({ charge: chargeMock })),
}));

const { default: BalanceService } = await import('#service/balance.service.js');
const { default: BalanceRepository } = await import('#repositories/balance.repository.js');
const { default: PaymentOptionRepository } = await import('#repositories/payment-option.repository.js');
const models = (await import('#models/index.js')).default;

function buildService() {
  const balanceRepository = Object.create(BalanceRepository.prototype);
  balanceRepository.model = models.Balance;
  const paymentOptionRepository = Object.create(PaymentOptionRepository.prototype);
  paymentOptionRepository.model = models.PaymentOption;

  const service = Object.create(BalanceService.prototype);
  service.balanceRepository = balanceRepository;
  service.paymentOptionRepository = paymentOptionRepository;
  return service;
}

describe('BalanceService.payBalance (integration)', () => {
  beforeEach(() => chargeMock.mockReset().mockResolvedValue({ success: true }));

  it('charges the gateway and persists the balance as paid off', async () => {
    await seedWithTransaction(
      {
        Balance: [balanceFixtures.balanceWithAmount],
        PaymentOption: [paymentOptionFixtures.stripeOption],
      },
      async ({ seeded }) => {
        const service = buildService();
        const paymentOptionId = seeded.PaymentOption[0].id;

        const result = await service.payBalance(balanceFixtures.balanceWithAmount.customerId, paymentOptionId);

        expect(chargeMock).toHaveBeenCalledWith({
          amount: balanceFixtures.balanceWithAmount.amount,
          currency: balanceFixtures.balanceWithAmount.currency,
          externalId: paymentOptionFixtures.stripeOption.externalId,
        });
        expect(Number(result.amount)).toBe(0);
      },
    );
  });
});
