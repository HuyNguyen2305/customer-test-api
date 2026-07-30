import { jest } from '@jest/globals';

const { default: CustomerLedgerEntryRepository } = await import('#repositories/customer-ledger-entry.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('CustomerLedgerEntryRepository.listByCustomerId', () => {
  it('queries ledger entries scoped to the customerId with pagination', async () => {
    const scopedModel = { findAndCountAll: jest.fn().mockResolvedValue({ rows: [], count: 0 }) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerLedgerEntryRepository.prototype);
    repository.model = model;

    await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.listByCustomerId('c1', { limit: 20, offset: 0 }),
    );

    expect(scopedModel.findAndCountAll).toHaveBeenCalledWith({
      where: { customerId: 'c1' },
      limit: 20,
      offset: 0,
      order: [['createdAt', 'DESC']],
    });
  });
});
