import { jest } from '@jest/globals';

const { default: AddressService } = await import('#service/address.service.js');
const { NotFoundError } = await import('#configs/error.js');

describe('AddressService.getAddressById', () => {
  it('returns the address for the authenticated customer', async () => {
    const address = { id: 'a1', customerId: 'c1' };
    const service = Object.create(AddressService.prototype);
    service.addressRepository = { getByIdForCustomer: jest.fn().mockResolvedValue(address) };

    const result = await service.getAddressById('c1', 'a1');

    expect(service.addressRepository.getByIdForCustomer).toHaveBeenCalledWith('a1', 'c1');
    expect(result).toBe(address);
  });

  it('throws NotFoundError when the address belongs to another customer', async () => {
    const service = Object.create(AddressService.prototype);
    service.addressRepository = { getByIdForCustomer: jest.fn().mockResolvedValue(null) };

    await expect(service.getAddressById('c1', 'someone-elses-address')).rejects.toThrow(NotFoundError);
  });
});
