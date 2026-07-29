import { seedWithTransaction } from '../../../helpers/seed-fixtures.js';
import balanceFixtures from '../../../fixtures/balance.fixtures.cjs';

const { default: BalanceRepository } = await import('#repositories/balance.repository.js');
const models = (await import('#models/index.js')).default;

describe('BalanceRepository.payOff (integration)', () => {
  it('zeroes the amount for the customer in the database', async () => {
    await seedWithTransaction({ Balance: [balanceFixtures.balanceWithAmount] }, async () => {
      const repository = Object.create(BalanceRepository.prototype);
      repository.model = models.Balance;

      await repository.payOff(balanceFixtures.balanceWithAmount.customerId);
      const result = await repository.getBalance(balanceFixtures.balanceWithAmount.customerId);

      expect(Number(result.amount)).toBe(0);
    });
  });
});
