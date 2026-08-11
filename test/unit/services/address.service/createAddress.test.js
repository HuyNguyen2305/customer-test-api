import { jest } from '@jest/globals';

const { default: AddressService } = await import('#service/address.service.js');

describe('AddressService.createAddress', () => {
  it('marks the address as default when the customer has no existing addresses', async () => {
    const created = { id: 'a1', isDefault: true };
    const service = Object.create(AddressService.prototype);
    service.addressRepository = {
      listByCustomerId: jest.fn().mockResolvedValue([]),
      createAddress: jest.fn().mockResolvedValue(created),
    };

    const result = await service.createAddress('c1', {
      label: 'Home',
      line1: '1 Main St',
      line2: null,
      city: 'Springfield',
      state: 'IL',
      zip: '62701',
      country: 'US',
    });

    expect(service.addressRepository.createAddress).toHaveBeenCalledWith({
      customerId: 'c1',
      label: 'Home',
      line1: '1 Main St',
      line2: null,
      city: 'Springfield',
      state: 'IL',
      zip: '62701',
      country: 'US',
      isDefault: true,
    });
    expect(result).toBe(created);
  });

  it('does not mark the address as default when the customer already has addresses', async () => {
    const service = Object.create(AddressService.prototype);
    service.addressRepository = {
      listByCustomerId: jest.fn().mockResolvedValue([{ id: 'existing' }]),
      createAddress: jest.fn().mockResolvedValue({ id: 'a2', isDefault: false }),
    };

    await service.createAddress('c1', { label: 'Work', line1: '2 Main St' });

    expect(service.addressRepository.createAddress).toHaveBeenCalledWith(
      expect.objectContaining({ isDefault: false }),
    );
  });
});
