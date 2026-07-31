import { jest } from '@jest/globals';

const { default: CustomerLedgerEntryRepository } = await import('#repositories/customer-ledger-entry.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('CustomerLedgerEntryRepository.getBalanceByCustomer', () => {
  it('runs a single aggregate query scoped to customerId, restricted to charge/payment types', async () => {
    const scopedModel = { findOne: jest.fn().mockResolvedValue({ balance: '180' }) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerLedgerEntryRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.getBalanceByCustomer('c1'),
    );

    expect(scopedModel.findOne).toHaveBeenCalledTimes(1);
    const callArgs = scopedModel.findOne.mock.calls[0][0];
    expect(callArgs.where.customerId).toBe('c1');
    expect(callArgs.where.type[Object.getOwnPropertySymbols(callArgs.where.type)[0]]).toEqual(['charge', 'payment']);
    expect(result).toBe(180);
  });

  it('returns 0 instead of NaN when there are no matching entries', async () => {
    const scopedModel = { findOne: jest.fn().mockResolvedValue({ balance: null }) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerLedgerEntryRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.getBalanceByCustomer('c1'),
    );

    expect(result).toBe(0);
  });
});
