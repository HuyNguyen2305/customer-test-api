import { jest } from '@jest/globals';

const { default: CustomerService } = await import('#service/customer.service.js');
const { NotFoundError } = await import('#configs/error.js');

describe('CustomerService.getProfile', () => {
  it('returns the customer with addresses', async () => {
    const customer = { id: 'c1', firstName: 'Jane', Addresses: [] };
    const service = Object.create(CustomerService.prototype);
    service.customerRepository = { findByIdWithAddresses: jest.fn().mockResolvedValue(customer) };

    const result = await service.getProfile('c1');

    expect(service.customerRepository.findByIdWithAddresses).toHaveBeenCalledWith('c1');
    expect(result).toBe(customer);
  });

  it('throws NotFoundError when the customer does not exist', async () => {
    const service = Object.create(CustomerService.prototype);
    service.customerRepository = { findByIdWithAddresses: jest.fn().mockResolvedValue(null) };

    await expect(service.getProfile('missing')).rejects.toThrow(NotFoundError);
  });
});
