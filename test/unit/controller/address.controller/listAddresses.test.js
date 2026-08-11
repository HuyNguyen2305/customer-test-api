import { jest } from '@jest/globals';

const requireCustomerIdMock = jest.fn();

jest.unstable_mockModule('#common/require-customer-id.js', () => ({
  requireCustomerId: requireCustomerIdMock,
}));

const { default: AddressController } = await import('#controller/address.controller.js');

describe('AddressController.listAddresses', () => {
  beforeEach(() => requireCustomerIdMock.mockReset());

  it("sends the authenticated customer's addresses", async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const data = [{ id: 'a1' }];
    const controller = Object.create(AddressController.prototype);
    controller.addressService = { listAddresses: jest.fn().mockResolvedValue(data) };
    const reply = { send: jest.fn() };

    await controller.listAddresses({}, reply);

    expect(controller.addressService.listAddresses).toHaveBeenCalledWith('c1');
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Addresses retrieved', data });
  });
});
