import { jest } from '@jest/globals';

const getMock = jest.fn();

jest.unstable_mockModule('#common/request-context.js', () => ({
  requestContext: { get: getMock },
}));

const { default: BalanceController } = await import('#controller/balance.controller.js');

describe('BalanceController.payBalance', () => {
  beforeEach(() => getMock.mockReset());

  it('pays the balance using the identity customerId and body paymentMethodId', async () => {
    getMock.mockReturnValue({ customerId: 'c1' });
    const data = { amount: 0, currency: 'USD' };
    const controller = Object.create(BalanceController.prototype);
    controller.balanceService = { payBalance: jest.fn().mockResolvedValue(data) };
    const reply = { send: jest.fn() };

    await controller.payBalance({ body: { paymentMethodId: 'pm1' } }, reply);

    expect(controller.balanceService.payBalance).toHaveBeenCalledWith('c1', 'pm1');
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Balance paid', data });
  });
});
