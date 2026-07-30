import { jest } from '@jest/globals';

const requireCustomerIdMock = jest.fn();

jest.unstable_mockModule('#common/require-customer-id.js', () => ({
  requireCustomerId: requireCustomerIdMock,
}));

const { default: CustomerLedgerController } = await import('#controller/customer-ledger.controller.js');

describe('CustomerLedgerController.listLedger', () => {
  beforeEach(() => requireCustomerIdMock.mockReset());

  it('sends ledger entries and pagination for the authenticated customer', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const entries = [{ id: 'l1', type: 'charge', amount: 100 }];
    const pagination = { page: 1, pageSize: 20, total: 1, totalPages: 1 };
    const controller = Object.create(CustomerLedgerController.prototype);
    controller.ledgerService = { listLedger: jest.fn().mockResolvedValue({ entries, pagination }) };
    const reply = { send: jest.fn() };
    const request = { query: {} };

    await controller.listLedger(request, reply);

    expect(reply.send).toHaveBeenCalledWith({
      success: true,
      message: 'Ledger retrieved',
      data: entries,
      pagination,
    });
  });
});
