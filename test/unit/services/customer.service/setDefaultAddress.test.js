import { jest } from '@jest/globals';

const { default: CustomerService } = await import('#service/customer.service.js');
const { NotFoundError } = await import('#configs/error.js');

describe('CustomerService.setDefaultAddress', () => {
  it('delegates to the repository and returns the updated address', async () => {
    const address = { id: 'a1', customerId: 'c1', isDefault: true };
    const service = Object.create(CustomerService.prototype);
    service.customerRepository = { setDefaultAddress: jest.fn().mockResolvedValue(address) };

    const result = await service.setDefaultAddress('c1', 'a1');

    expect(service.customerRepository.setDefaultAddress).toHaveBeenCalledWith('a1', 'c1');
    expect(result).toBe(address);
  });

  it('throws NotFoundError when the address does not exist or belongs to another customer', async () => {
    const service = Object.create(CustomerService.prototype);
    service.customerRepository = { setDefaultAddress: jest.fn().mockResolvedValue(null) };

    await expect(service.setDefaultAddress('c1', 'missing')).rejects.toThrow(NotFoundError);
  });
});
