import { seedWithTransaction } from '../../../helpers/seed-fixtures.js';
import balanceFixtures from '../../../fixtures/balance.fixtures.cjs';

const { default: BalanceRepository } = await import('#repositories/balance.repository.js');
const models = (await import('#models/index.js')).default;

describe('BalanceRepository.getBalance (integration)', () => {
  it('reads back the seeded balance row for the customer', async () => {
    await seedWithTransaction({ Balance: [balanceFixtures.balanceWithAmount] }, async () => {
      const repository = Object.create(BalanceRepository.prototype);
      repository.model = models.Balance;

      const result = await repository.getBalance(balanceFixtures.balanceWithAmount.customerId);

      expect(result).not.toBeNull();
      expect(Number(result.amount)).toBe(balanceFixtures.balanceWithAmount.amount);
      expect(result.currency).toBe(balanceFixtures.balanceWithAmount.currency);
    });
  });

  it('returns null for a customer with no balance row', async () => {
    await seedWithTransaction({ Balance: [balanceFixtures.balanceWithAmount] }, async () => {
      const repository = Object.create(BalanceRepository.prototype);
      repository.model = models.Balance;

      const result = await repository.getBalance('99999999-9999-9999-9999-999999999999');

      expect(result).toBeNull();
    });
  });
});
