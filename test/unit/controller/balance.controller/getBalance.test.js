import { jest } from '@jest/globals';

const requireCustomerIdMock = jest.fn();

jest.unstable_mockModule('#common/require-customer-id.js', () => ({
  requireCustomerId: requireCustomerIdMock,
}));

const { default: BalanceController } = await import('#controller/balance.controller.js');
const { UnauthorizedError } = await import('#configs/error.js');

describe('BalanceController.getBalance', () => {
  beforeEach(() => requireCustomerIdMock.mockReset());

  it('sends the balance for the authenticated customerId', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const data = { amount: 10, currency: 'USD' };
    const controller = Object.create(BalanceController.prototype);
    controller.balanceService = { getBalance: jest.fn().mockResolvedValue(data) };
    const reply = { send: jest.fn() };

    await controller.getBalance({}, reply);

    expect(controller.balanceService.getBalance).toHaveBeenCalledWith('c1');
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Balance retrieved', data });
  });

  it('propagates UnauthorizedError instead of calling the service when there is no identity', async () => {
    requireCustomerIdMock.mockImplementation(() => {
      throw new UnauthorizedError('Authentication required');
    });
    const controller = Object.create(BalanceController.prototype);
    controller.balanceService = { getBalance: jest.fn() };
    const reply = { send: jest.fn() };

    await expect(controller.getBalance({}, reply)).rejects.toThrow(UnauthorizedError);

    expect(controller.balanceService.getBalance).not.toHaveBeenCalled();
  });
});
