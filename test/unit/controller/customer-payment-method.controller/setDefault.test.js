import { jest } from '@jest/globals';

const requireCustomerIdMock = jest.fn();

jest.unstable_mockModule('#common/require-customer-id.js', () => ({
  requireCustomerId: requireCustomerIdMock,
}));

const { default: CustomerPaymentMethodController } = await import('#controller/customer-payment-method.controller.js');
const { UnauthorizedError } = await import('#configs/error.js');

describe('CustomerPaymentMethodController.setDefault', () => {
  beforeEach(() => requireCustomerIdMock.mockReset());

  it('sends the updated payment method for the authenticated customer', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const data = { id: 'pm1', isDefault: true };
    const controller = Object.create(CustomerPaymentMethodController.prototype);
    controller.customerPaymentMethodService = { setDefault: jest.fn().mockResolvedValue(data) };
    const reply = { send: jest.fn() };
    const request = { params: { id: 'pm1' } };

    await controller.setDefault(request, reply);

    expect(controller.customerPaymentMethodService.setDefault).toHaveBeenCalledWith('c1', 'pm1');
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Default payment method updated', data });
  });

  it('rejects when unauthenticated', async () => {
    requireCustomerIdMock.mockImplementation(() => {
      throw new UnauthorizedError('Authentication required');
    });
    const controller = Object.create(CustomerPaymentMethodController.prototype);
    controller.customerPaymentMethodService = { setDefault: jest.fn() };

    await expect(controller.setDefault({ params: { id: 'pm1' } }, { send: jest.fn() })).rejects.toThrow(
      UnauthorizedError,
    );
    expect(controller.customerPaymentMethodService.setDefault).not.toHaveBeenCalled();
  });
});
