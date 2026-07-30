import { jest } from '@jest/globals';

const requireCustomerIdMock = jest.fn();

jest.unstable_mockModule('#common/require-customer-id.js', () => ({
  requireCustomerId: requireCustomerIdMock,
}));

const { default: CustomerController } = await import('#controller/customer.controller.js');
const { UnauthorizedError } = await import('#configs/error.js');

describe('CustomerController.getProfile', () => {
  beforeEach(() => requireCustomerIdMock.mockReset());

  it('sends the profile for the authenticated customer', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const data = { id: 'c1', firstName: 'Jane' };
    const controller = Object.create(CustomerController.prototype);
    controller.customerService = { getProfile: jest.fn().mockResolvedValue(data) };
    const reply = { send: jest.fn() };

    await controller.getProfile({}, reply);

    expect(controller.customerService.getProfile).toHaveBeenCalledWith('c1');
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Profile retrieved', data });
  });

  it('propagates UnauthorizedError without calling the service when unauthenticated', async () => {
    requireCustomerIdMock.mockImplementation(() => {
      throw new UnauthorizedError('Authentication required');
    });
    const controller = Object.create(CustomerController.prototype);
    controller.customerService = { getProfile: jest.fn() };
    const reply = { send: jest.fn() };

    await expect(controller.getProfile({}, reply)).rejects.toThrow(UnauthorizedError);
    expect(controller.customerService.getProfile).not.toHaveBeenCalled();
  });
});
