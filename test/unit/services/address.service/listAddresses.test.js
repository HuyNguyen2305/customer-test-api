import { jest } from '@jest/globals';

const { default: AddressService } = await import('#service/address.service.js');

describe('AddressService.listAddresses', () => {
  it("delegates to the repository and returns the customer's addresses", async () => {
    const addresses = [{ id: 'a1' }, { id: 'a2' }];
    const service = Object.create(AddressService.prototype);
    service.addressRepository = { listByCustomerId: jest.fn().mockResolvedValue(addresses) };

    const result = await service.listAddresses('c1');

    expect(service.addressRepository.listByCustomerId).toHaveBeenCalledWith('c1');
    expect(result).toBe(addresses);
  });
});
