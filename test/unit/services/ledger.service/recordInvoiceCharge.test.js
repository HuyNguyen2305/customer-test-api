import { jest } from '@jest/globals';

const { default: LedgerService } = await import('#service/ledger.service.js');

describe('LedgerService.recordInvoiceCharge', () => {
  it('creates a charge entry for the invoice total, referencing the invoice', async () => {
    const service = Object.create(LedgerService.prototype);
    service.customerLedgerEntryRepository = { createEntry: jest.fn().mockResolvedValue({ id: 'entry1' }) };

    const invoice = { id: 'inv1', customerId: 'c1', balanceDue: 150 };
    await service.recordInvoiceCharge(invoice);

    expect(service.customerLedgerEntryRepository.createEntry).toHaveBeenCalledWith({
      customerId: 'c1',
      type: 'charge',
      amount: 150,
      referenceId: 'inv1',
    });
  });
});
