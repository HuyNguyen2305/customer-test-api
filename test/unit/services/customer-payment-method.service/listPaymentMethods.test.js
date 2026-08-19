import { jest } from '@jest/globals';

const { default: CustomerPaymentMethodService } = await import('#service/customer-payment-method.service.js');

describe('CustomerPaymentMethodService.listPaymentMethods', () => {
  it('delegates to the repository scoped by customerId', async () => {
    const paymentMethods = [
      { id: 'pm1', type: 'card', paymentDetails: { token: 'tok_123', gateway: 'square' }, isDefault: true },
    ];
    const service = Object.create(CustomerPaymentMethodService.prototype);
    service.customerPaymentMethodRepository = { listByCustomerId: jest.fn().mockResolvedValue(paymentMethods) };

    const result = await service.listPaymentMethods('c1');

    expect(service.customerPaymentMethodRepository.listByCustomerId).toHaveBeenCalledWith('c1');
    expect(result).toEqual([
      { id: 'pm1', type: 'card', token: 'tok_123', gateway: 'square', creditBalance: null, isDefault: true },
    ]);
  });

  it('returns an empty list without error when the customer has none', async () => {
    const service = Object.create(CustomerPaymentMethodService.prototype);
    service.customerPaymentMethodRepository = { listByCustomerId: jest.fn().mockResolvedValue([]) };

    const result = await service.listPaymentMethods('c1');

    expect(result).toEqual([]);
  });

  it('coerces a string creditBalance (as returned by Postgres DECIMAL columns) to a number', async () => {
    const paymentMethods = [
      { id: 'pm-credit', type: 'open_credit', paymentDetails: { creditBalance: '200.00' }, isDefault: false },
    ];
    const service = Object.create(CustomerPaymentMethodService.prototype);
    service.customerPaymentMethodRepository = { listByCustomerId: jest.fn().mockResolvedValue(paymentMethods) };

    const result = await service.listPaymentMethods('c1');

    expect(result[0].creditBalance).toBe(200);
  });
});
