import { jest } from '@jest/globals';

const { default: AddressService } = await import('#service/address.service.js');
const { NotFoundError } = await import('#configs/error.js');

describe('AddressService.updateAddress', () => {
  it('delegates to the repository and returns the updated address', async () => {
    const updated = { id: 'a1', label: 'Work' };
    const service = Object.create(AddressService.prototype);
    service.addressRepository = { updateAddress: jest.fn().mockResolvedValue(updated) };

    const result = await service.updateAddress('c1', 'a1', { label: 'Work' });

    expect(service.addressRepository.updateAddress).toHaveBeenCalledWith('a1', 'c1', { label: 'Work' });
    expect(result).toBe(updated);
  });

  it('throws NotFoundError when the address does not exist or belongs to another customer', async () => {
    const service = Object.create(AddressService.prototype);
    service.addressRepository = { updateAddress: jest.fn().mockResolvedValue(null) };

    await expect(service.updateAddress('c1', 'missing', { label: 'Work' })).rejects.toThrow(NotFoundError);
  });
});
