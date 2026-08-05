import { jest } from '@jest/globals';

const { default: CustomerPaymentMethodService } = await import('#service/customer-payment-method.service.js');

describe('CustomerPaymentMethodService.grantOpenCredit', () => {
  it('delegates to the repository upsert', async () => {
    const service = Object.create(CustomerPaymentMethodService.prototype);
    service.customerPaymentMethodRepository = {
      upsertOpenCredit: jest.fn().mockResolvedValue({ id: 'pm1', creditBalance: 50 }),
    };

    const result = await service.grantOpenCredit('c1', 50);

    expect(service.customerPaymentMethodRepository.upsertOpenCredit).toHaveBeenCalledWith('c1', 50);
    expect(result).toEqual({ id: 'pm1', creditBalance: 50 });
  });
});
