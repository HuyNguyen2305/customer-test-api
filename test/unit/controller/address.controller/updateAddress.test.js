import { jest } from '@jest/globals';

const requireCustomerIdMock = jest.fn();

jest.unstable_mockModule('#common/require-customer-id.js', () => ({
  requireCustomerId: requireCustomerIdMock,
}));

const { default: AddressController } = await import('#controller/address.controller.js');

describe('AddressController.updateAddress', () => {
  beforeEach(() => requireCustomerIdMock.mockReset());

  it('strips isDefault (and any other unlisted field) from the body before passing it to the service', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const data = { id: 'a1', label: 'Work' };
    const controller = Object.create(AddressController.prototype);
    controller.addressService = { updateAddress: jest.fn().mockResolvedValue(data) };
    const reply = { send: jest.fn() };
    const request = { params: { id: 'a1' }, body: { label: 'Work', isDefault: true } };

    await controller.updateAddress(request, reply);

    expect(controller.addressService.updateAddress).toHaveBeenCalledWith('c1', 'a1', {
      label: 'Work',
      line1: undefined,
      line2: undefined,
      city: undefined,
      state: undefined,
      zip: undefined,
      country: undefined,
    });
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Address updated', data });
  });
});
