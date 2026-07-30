import { jest } from '@jest/globals';

const requireCustomerIdMock = jest.fn();

jest.unstable_mockModule('#common/require-customer-id.js', () => ({
  requireCustomerId: requireCustomerIdMock,
}));

const { default: CustomerPaymentMethodController } = await import('#controller/customer-payment-method.controller.js');
const { UnauthorizedError } = await import('#configs/error.js');

describe('CustomerPaymentMethodController.listPaymentMethods', () => {
  beforeEach(() => requireCustomerIdMock.mockReset());

  it('sends the payment methods for the authenticated customer', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const data = [{ id: 'pm1', type: 'card', token: 'tok_123', isDefault: true }];
    const controller = Object.create(CustomerPaymentMethodController.prototype);
    controller.customerPaymentMethodService = { listPaymentMethods: jest.fn().mockResolvedValue(data) };
    const reply = { send: jest.fn() };

    await controller.listPaymentMethods({}, reply);

    expect(controller.customerPaymentMethodService.listPaymentMethods).toHaveBeenCalledWith('c1');
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Payment methods retrieved', data });
  });

  it('rejects when unauthenticated', async () => {
    requireCustomerIdMock.mockImplementation(() => {
      throw new UnauthorizedError('Authentication required');
    });
    const controller = Object.create(CustomerPaymentMethodController.prototype);
    controller.customerPaymentMethodService = { listPaymentMethods: jest.fn() };

    await expect(controller.listPaymentMethods({}, { send: jest.fn() })).rejects.toThrow(UnauthorizedError);
  });
});
