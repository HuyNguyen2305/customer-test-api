import { jest } from '@jest/globals';

const { default: LedgerService } = await import('#service/ledger.service.js');

describe('LedgerService.listLedger', () => {
  it('paginates using default page/pageSize and shapes the result', async () => {
    const rows = [{ id: 'l1', type: 'charge', amount: 100 }];
    const service = Object.create(LedgerService.prototype);
    service.customerLedgerEntryRepository = { listByCustomerId: jest.fn().mockResolvedValue({ rows, count: 1 }) };

    const result = await service.listLedger('c1');

    expect(service.customerLedgerEntryRepository.listByCustomerId).toHaveBeenCalledWith('c1', {
      limit: 20,
      offset: 0,
    });
    expect(result).toEqual({
      entries: rows,
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    });
  });

  it('returns an empty list without error when the customer has no ledger entries', async () => {
    const service = Object.create(LedgerService.prototype);
    service.customerLedgerEntryRepository = { listByCustomerId: jest.fn().mockResolvedValue({ rows: [], count: 0 }) };

    const result = await service.listLedger('c1');

    expect(result.entries).toEqual([]);
  });
});
