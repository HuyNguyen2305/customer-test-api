import { jest } from '@jest/globals';

const { default: CustomerPaymentMethodService } = await import('#service/customer-payment-method.service.js');

describe('CustomerPaymentMethodService.listPaymentMethods', () => {
  it('delegates to the repository scoped by customerId', async () => {
    const paymentMethods = [{ id: 'pm1', type: 'card', token: 'tok_123', isDefault: true }];
    const service = Object.create(CustomerPaymentMethodService.prototype);
    service.customerPaymentMethodRepository = { listByCustomerId: jest.fn().mockResolvedValue(paymentMethods) };

    const result = await service.listPaymentMethods('c1');

    expect(service.customerPaymentMethodRepository.listByCustomerId).toHaveBeenCalledWith('c1');
    expect(result).toBe(paymentMethods);
  });

  it('returns an empty list without error when the customer has none', async () => {
    const service = Object.create(CustomerPaymentMethodService.prototype);
    service.customerPaymentMethodRepository = { listByCustomerId: jest.fn().mockResolvedValue([]) };

    const result = await service.listPaymentMethods('c1');

    expect(result).toEqual([]);
  });
});
