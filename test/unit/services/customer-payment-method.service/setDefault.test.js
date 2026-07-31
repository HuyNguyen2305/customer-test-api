import { jest } from '@jest/globals';

const { default: CustomerPaymentMethodService } = await import('#service/customer-payment-method.service.js');
const { NotFoundError } = await import('#configs/error.js');

describe('CustomerPaymentMethodService.setDefault', () => {
  it('delegates to the repository and returns the updated payment method', async () => {
    const paymentMethod = { id: 'pm1', customerId: 'c1', isDefault: true };
    const service = Object.create(CustomerPaymentMethodService.prototype);
    service.customerPaymentMethodRepository = { setDefault: jest.fn().mockResolvedValue(paymentMethod) };

    const result = await service.setDefault('c1', 'pm1');

    expect(service.customerPaymentMethodRepository.setDefault).toHaveBeenCalledWith('pm1', 'c1');
    expect(result).toBe(paymentMethod);
  });

  it('throws NotFoundError when the payment method does not exist or belongs to another customer', async () => {
    const service = Object.create(CustomerPaymentMethodService.prototype);
    service.customerPaymentMethodRepository = { setDefault: jest.fn().mockResolvedValue(null) };

    await expect(service.setDefault('c1', 'missing')).rejects.toThrow(NotFoundError);
  });
});
