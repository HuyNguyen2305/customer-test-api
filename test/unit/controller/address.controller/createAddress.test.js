import { jest } from '@jest/globals';

const requireCustomerIdMock = jest.fn();

jest.unstable_mockModule('#common/require-customer-id.js', () => ({
  requireCustomerId: requireCustomerIdMock,
}));

const { default: AddressController } = await import('#controller/address.controller.js');

describe('AddressController.createAddress', () => {
  beforeEach(() => requireCustomerIdMock.mockReset());

  it('creates an address from the allowlisted body fields', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const data = { id: 'a1' };
    const controller = Object.create(AddressController.prototype);
    controller.addressService = { createAddress: jest.fn().mockResolvedValue(data) };
    const reply = { send: jest.fn() };
    const request = {
      body: {
        label: 'Home',
        line1: '1 Main St',
        line2: null,
        city: 'Springfield',
        state: 'IL',
        zip: '62701',
        country: 'US',
        isDefault: true,
      },
    };

    await controller.createAddress(request, reply);

    expect(controller.addressService.createAddress).toHaveBeenCalledWith('c1', {
      label: 'Home',
      line1: '1 Main St',
      line2: null,
      city: 'Springfield',
      state: 'IL',
      zip: '62701',
      country: 'US',
    });
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Address created', data });
  });
});
