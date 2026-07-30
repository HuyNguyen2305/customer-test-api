import { jest } from '@jest/globals';

const { default: LedgerService } = await import('#service/ledger.service.js');

function buildService({ charges = 0, payments = 0 } = {}) {
  const service = Object.create(LedgerService.prototype);
  service.customerLedgerEntryRepository = {
    sumByCustomerAndType: jest.fn((customerId, type) => Promise.resolve(type === 'charge' ? charges : payments)),
  };
  return service;
}

describe('LedgerService.getCustomerBalance', () => {
  it('computes balance as sum(charges) - sum(payments)', async () => {
    const service = buildService({ charges: 300, payments: 120 });

    const result = await service.getCustomerBalance('c1');

    expect(result).toBe(180);
  });

  it('only ever sums charge and payment types, never adjustment/refund', async () => {
    const service = buildService({ charges: 100, payments: 40 });

    await service.getCustomerBalance('c1');

    const calledTypes = service.customerLedgerEntryRepository.sumByCustomerAndType.mock.calls.map((call) => call[1]);
    expect(calledTypes.sort()).toEqual(['charge', 'payment']);
    expect(calledTypes).not.toContain('adjustment');
    expect(calledTypes).not.toContain('refund');
  });
});
