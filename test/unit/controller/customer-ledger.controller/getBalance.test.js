import { jest } from '@jest/globals';

const requireCustomerIdMock = jest.fn();

jest.unstable_mockModule('#common/require-customer-id.js', () => ({
  requireCustomerId: requireCustomerIdMock,
}));

const { default: CustomerLedgerController } = await import('#controller/customer-ledger.controller.js');

describe('CustomerLedgerController.getBalance', () => {
  beforeEach(() => requireCustomerIdMock.mockReset());

  it('sends the computed balance for the authenticated customer', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const controller = Object.create(CustomerLedgerController.prototype);
    controller.ledgerService = { getCustomerBalance: jest.fn().mockResolvedValue(180) };
    const reply = { send: jest.fn() };

    await controller.getBalance({}, reply);

    expect(controller.ledgerService.getCustomerBalance).toHaveBeenCalledWith('c1');
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Balance retrieved', data: { balance: 180 } });
  });
});
