import { jest } from '@jest/globals';

const getMock = jest.fn();

jest.unstable_mockModule('#common/request-context.js', () => ({
  requestContext: { get: getMock },
}));

const { default: BalanceController } = await import('#controller/balance.controller.js');

describe('BalanceController.getBalance', () => {
  beforeEach(() => getMock.mockReset());

  it('sends the balance for the identity customerId', async () => {
    getMock.mockReturnValue({ customerId: 'c1' });
    const data = { amount: 10, currency: 'USD' };
    const controller = Object.create(BalanceController.prototype);
    controller.balanceService = { getBalance: jest.fn().mockResolvedValue(data) };
    const reply = { send: jest.fn() };

    await controller.getBalance({}, reply);

    expect(controller.balanceService.getBalance).toHaveBeenCalledWith('c1');
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Balance retrieved', data });
  });

  it('passes undefined customerId when there is no identity', async () => {
    getMock.mockReturnValue(undefined);
    const controller = Object.create(BalanceController.prototype);
    controller.balanceService = { getBalance: jest.fn().mockResolvedValue({}) };
    const reply = { send: jest.fn() };

    await controller.getBalance({}, reply);

    expect(controller.balanceService.getBalance).toHaveBeenCalledWith(undefined);
  });
});
