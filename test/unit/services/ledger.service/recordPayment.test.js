import { jest } from '@jest/globals';

const { default: LedgerService } = await import('#service/ledger.service.js');

describe('LedgerService.recordPayment', () => {
  it('creates a payment entry referencing the invoice', async () => {
    const service = Object.create(LedgerService.prototype);
    service.customerLedgerEntryRepository = { createEntry: jest.fn().mockResolvedValue({ id: 'entry2' }) };

    await service.recordPayment({ customerId: 'c1', invoiceId: 'inv1', amount: 75 });

    expect(service.customerLedgerEntryRepository.createEntry).toHaveBeenCalledWith(
      {
        customerId: 'c1',
        type: 'payment',
        amount: 75,
        referenceId: 'inv1',
      },
      {},
    );
  });
});
