import { jest } from '@jest/globals';

const requireCustomerIdMock = jest.fn();

jest.unstable_mockModule('#common/require-customer-id.js', () => ({
  requireCustomerId: requireCustomerIdMock,
}));

const { default: AddressController } = await import('#controller/address.controller.js');
const { NotFoundError } = await import('#configs/error.js');

describe('AddressController.getAddressById', () => {
  beforeEach(() => requireCustomerIdMock.mockReset());

  it('sends the address for the authenticated customer and requested id', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const data = { id: 'a1' };
    const controller = Object.create(AddressController.prototype);
    controller.addressService = { getAddressById: jest.fn().mockResolvedValue(data) };
    const reply = { send: jest.fn() };
    const request = { params: { id: 'a1' } };

    await controller.getAddressById(request, reply);

    expect(controller.addressService.getAddressById).toHaveBeenCalledWith('c1', 'a1');
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Address retrieved', data });
  });

  it('propagates NotFoundError when the address belongs to another customer', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const controller = Object.create(AddressController.prototype);
    controller.addressService = {
      getAddressById: jest.fn().mockRejectedValue(new NotFoundError('Address not found')),
    };
    const request = { params: { id: 'other-customers-address' } };

    await expect(controller.getAddressById(request, { send: jest.fn() })).rejects.toThrow(NotFoundError);
  });
});
