import { jest } from '@jest/globals';

const requireCustomerIdMock = jest.fn();

jest.unstable_mockModule('#common/require-customer-id.js', () => ({
  requireCustomerId: requireCustomerIdMock,
}));

const { default: CustomerController } = await import('#controller/customer.controller.js');
const { UnauthorizedError } = await import('#configs/error.js');

describe('CustomerController.setDefaultAddress', () => {
  beforeEach(() => requireCustomerIdMock.mockReset());

  it('sends the updated address for the authenticated customer', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const data = { id: 'a1', isDefault: true };
    const controller = Object.create(CustomerController.prototype);
    controller.customerService = { setDefaultAddress: jest.fn().mockResolvedValue(data) };
    const reply = { send: jest.fn() };
    const request = { params: { id: 'a1' } };

    await controller.setDefaultAddress(request, reply);

    expect(controller.customerService.setDefaultAddress).toHaveBeenCalledWith('c1', 'a1');
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Default address updated', data });
  });

  it('rejects when unauthenticated', async () => {
    requireCustomerIdMock.mockImplementation(() => {
      throw new UnauthorizedError('Authentication required');
    });
    const controller = Object.create(CustomerController.prototype);
    controller.customerService = { setDefaultAddress: jest.fn() };

    await expect(controller.setDefaultAddress({ params: { id: 'a1' } }, { send: jest.fn() })).rejects.toThrow(
      UnauthorizedError,
    );
    expect(controller.customerService.setDefaultAddress).not.toHaveBeenCalled();
  });
});
