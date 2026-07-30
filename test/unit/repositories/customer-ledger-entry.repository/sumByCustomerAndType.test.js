import { jest } from '@jest/globals';

const { default: CustomerLedgerEntryRepository } = await import('#repositories/customer-ledger-entry.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('CustomerLedgerEntryRepository.sumByCustomerAndType', () => {
  it('sums the amount column for the given customerId/type on the schema-scoped model', async () => {
    const scopedModel = { sum: jest.fn().mockResolvedValue(250) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerLedgerEntryRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.sumByCustomerAndType('c1', 'charge'),
    );

    expect(scopedModel.sum).toHaveBeenCalledWith('amount', { where: { customerId: 'c1', type: 'charge' } });
    expect(result).toBe(250);
  });

  it('returns 0 instead of null when there are no matching entries', async () => {
    const scopedModel = { sum: jest.fn().mockResolvedValue(null) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerLedgerEntryRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.sumByCustomerAndType('c1', 'payment'),
    );

    expect(result).toBe(0);
  });
});
