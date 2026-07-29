import { seedWithTransaction } from '../../../helpers/seed-fixtures.js';
import balanceFixtures from '../../../fixtures/balance.fixtures.cjs';

const { default: BalanceService } = await import('#service/balance.service.js');
const { default: BalanceRepository } = await import('#repositories/balance.repository.js');
const { NotFoundError } = await import('#configs/error.js');
const models = (await import('#models/index.js')).default;

function buildService() {
  const balanceRepository = Object.create(BalanceRepository.prototype);
  balanceRepository.model = models.Balance;
  const service = Object.create(BalanceService.prototype);
  service.balanceRepository = balanceRepository;
  return service;
}

describe('BalanceService.getBalance (integration)', () => {
  it('returns the persisted balance for the customer', async () => {
    await seedWithTransaction({ Balance: [balanceFixtures.balanceWithAmount] }, async () => {
      const service = buildService();

      const result = await service.getBalance(balanceFixtures.balanceWithAmount.customerId);

      expect(Number(result.amount)).toBe(balanceFixtures.balanceWithAmount.amount);
    });
  });

  it('throws NotFoundError when the customer has no balance row', async () => {
    await seedWithTransaction({ Balance: [balanceFixtures.balanceWithAmount] }, async () => {
      const service = buildService();

      await expect(service.getBalance('99999999-9999-9999-9999-999999999999')).rejects.toThrow(NotFoundError);
    });
  });
});
