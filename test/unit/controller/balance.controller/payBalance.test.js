import { jest } from '@jest/globals';

const requireCustomerIdMock = jest.fn();

jest.unstable_mockModule('#common/require-customer-id.js', () => ({
  requireCustomerId: requireCustomerIdMock,
}));

const { default: BalanceController } = await import('#controller/balance.controller.js');
const { UnauthorizedError } = await import('#configs/error.js');

describe('BalanceController.payBalance', () => {
  beforeEach(() => requireCustomerIdMock.mockReset());

  it('pays the balance using the authenticated customerId and body paymentMethodId', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const data = { amount: 0, currency: 'USD' };
    const controller = Object.create(BalanceController.prototype);
    controller.balanceService = { payBalance: jest.fn().mockResolvedValue(data) };
    const reply = { send: jest.fn() };

    await controller.payBalance({ body: { paymentMethodId: 'pm1' } }, reply);

    expect(controller.balanceService.payBalance).toHaveBeenCalledWith('c1', 'pm1');
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Balance paid', data });
  });

  it('propagates UnauthorizedError instead of calling the service when there is no identity', async () => {
    requireCustomerIdMock.mockImplementation(() => {
      throw new UnauthorizedError('Authentication required');
    });
    const controller = Object.create(BalanceController.prototype);
    controller.balanceService = { payBalance: jest.fn() };
    const reply = { send: jest.fn() };

    await expect(controller.payBalance({ body: { paymentMethodId: 'pm1' } }, reply)).rejects.toThrow(
      UnauthorizedError,
    );

    expect(controller.balanceService.payBalance).not.toHaveBeenCalled();
  });
});
