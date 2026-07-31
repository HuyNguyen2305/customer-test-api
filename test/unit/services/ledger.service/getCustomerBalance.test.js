import { jest } from '@jest/globals';

const { default: LedgerService } = await import('#service/ledger.service.js');

describe('LedgerService.getCustomerBalance', () => {
  it('delegates to a single database-side aggregate query', async () => {
    const service = Object.create(LedgerService.prototype);
    service.customerLedgerEntryRepository = { getBalanceByCustomer: jest.fn().mockResolvedValue(180) };

    const result = await service.getCustomerBalance('c1');

    expect(service.customerLedgerEntryRepository.getBalanceByCustomer).toHaveBeenCalledWith('c1');
    expect(service.customerLedgerEntryRepository.getBalanceByCustomer).toHaveBeenCalledTimes(1);
    expect(result).toBe(180);
  });
});
