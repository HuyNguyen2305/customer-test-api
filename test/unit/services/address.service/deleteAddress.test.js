import { jest } from '@jest/globals';

const { default: AddressService } = await import('#service/address.service.js');
const { NotFoundError } = await import('#configs/error.js');

describe('AddressService.deleteAddress', () => {
  it('delegates to the repository when the address is deleted', async () => {
    const service = Object.create(AddressService.prototype);
    service.addressRepository = { deleteAddress: jest.fn().mockResolvedValue(true) };

    await service.deleteAddress('c1', 'a1');

    expect(service.addressRepository.deleteAddress).toHaveBeenCalledWith('a1', 'c1');
  });

  it('throws NotFoundError when the address does not exist or belongs to another customer', async () => {
    const service = Object.create(AddressService.prototype);
    service.addressRepository = { deleteAddress: jest.fn().mockResolvedValue(false) };

    await expect(service.deleteAddress('c1', 'missing')).rejects.toThrow(NotFoundError);
  });
});
