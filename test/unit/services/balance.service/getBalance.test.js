import { jest } from '@jest/globals';

jest.unstable_mockModule('#common/factory/payment-gateway/payment-gateway.factory.js', () => ({
  getPaymentGateway: jest.fn(),
}));

const { default: BalanceService } = await import('#service/balance.service.js');
const { NotFoundError } = await import('#configs/error.js');

describe('BalanceService.getBalance', () => {
  it('returns the balance from the repository', async () => {
    const balance = { customerId: 'c1', amount: 42, currency: 'USD' };
    const service = Object.create(BalanceService.prototype);
    service.balanceRepository = { getBalance: jest.fn().mockResolvedValue(balance) };

    const result = await service.getBalance('c1');

    expect(service.balanceRepository.getBalance).toHaveBeenCalledWith('c1');
    expect(result).toBe(balance);
  });

  it('throws NotFoundError when no balance exists', async () => {
    const service = Object.create(BalanceService.prototype);
    service.balanceRepository = { getBalance: jest.fn().mockResolvedValue(null) };

    await expect(service.getBalance('missing')).rejects.toThrow(NotFoundError);
  });
});
