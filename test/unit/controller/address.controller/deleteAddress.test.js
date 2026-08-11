import { jest } from '@jest/globals';

const requireCustomerIdMock = jest.fn();

jest.unstable_mockModule('#common/require-customer-id.js', () => ({
  requireCustomerId: requireCustomerIdMock,
}));

const { default: AddressController } = await import('#controller/address.controller.js');

describe('AddressController.deleteAddress', () => {
  beforeEach(() => requireCustomerIdMock.mockReset());

  it('deletes the address for the authenticated customer and sends a null-data response', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const controller = Object.create(AddressController.prototype);
    controller.addressService = { deleteAddress: jest.fn().mockResolvedValue(undefined) };
    const reply = { send: jest.fn() };
    const request = { params: { id: 'a1' } };

    await controller.deleteAddress(request, reply);

    expect(controller.addressService.deleteAddress).toHaveBeenCalledWith('c1', 'a1');
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Address deleted', data: null });
  });
});
