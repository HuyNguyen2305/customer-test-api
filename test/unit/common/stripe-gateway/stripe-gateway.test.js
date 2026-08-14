import { jest } from '@jest/globals';

const customersCreateMock = jest.fn();
const paymentMethodsAttachMock = jest.fn();
const paymentIntentsCreateMock = jest.fn();

class FakeStripe {
  constructor() {
    this.customers = { create: customersCreateMock };
    this.paymentMethods = { attach: paymentMethodsAttachMock };
    this.paymentIntents = { create: paymentIntentsCreateMock };
  }
}

jest.unstable_mockModule('stripe', () => ({ default: FakeStripe }));

const { default: StripeGateway } = await import('#common/factory/payment-gateway/stripe-gateway.js');

describe('StripeGateway', () => {
  beforeEach(() => {
    customersCreateMock.mockReset().mockResolvedValue({ id: 'cus_1' });
    paymentMethodsAttachMock.mockReset().mockResolvedValue({ id: 'pm_1' });
    paymentIntentsCreateMock.mockReset().mockResolvedValue({ id: 'pi_1' });
  });

  it('createCustomer combines first/last name and returns the id', async () => {
    const gateway = new StripeGateway();

    const id = await gateway.createCustomer({ firstName: 'Amelia', lastName: 'Earhart', email: 'a@example.com' });

    expect(customersCreateMock).toHaveBeenCalledWith({ name: 'Amelia Earhart', email: 'a@example.com' });
    expect(id).toBe('cus_1');
  });

  it('createCardOnFile attaches an existing PaymentMethod id to the customer', async () => {
    const gateway = new StripeGateway();

    const id = await gateway.createCardOnFile({ sourceId: 'pm_test_1', customerId: 'cus_1' });

    expect(paymentMethodsAttachMock).toHaveBeenCalledWith('pm_test_1', { customer: 'cus_1' });
    expect(id).toBe('pm_1');
  });

  it('createBankAccountOnFile attaches an existing PaymentMethod id to the customer', async () => {
    const gateway = new StripeGateway();

    const id = await gateway.createBankAccountOnFile({ sourceId: 'pm_bank_1', customerId: 'cus_1' });

    expect(paymentMethodsAttachMock).toHaveBeenCalledWith('pm_bank_1', { customer: 'cus_1' });
    expect(id).toBe('pm_1');
  });

  it('charge sends amount in the smallest currency unit with the saved payment method and customer', async () => {
    const gateway = new StripeGateway();

    await gateway.charge({ amount: 12.5, currency: 'usd', sourceId: 'pm_1', customerId: 'cus_1' });

    expect(paymentIntentsCreateMock).toHaveBeenCalledWith(
      {
        amount: 1250,
        currency: 'usd',
        customer: 'cus_1',
        payment_method: 'pm_1',
        payment_method_types: ['card'],
        confirm: true,
        off_session: true,
      },
      undefined,
    );
  });

  it('charge uses us_bank_account payment_method_types when type is bank', async () => {
    const gateway = new StripeGateway();

    await gateway.charge({ amount: 12.5, currency: 'usd', sourceId: 'pm_bank_1', customerId: 'cus_1', type: 'bank' });

    expect(paymentIntentsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ payment_method_types: ['us_bank_account'] }),
      undefined,
    );
  });

  it('charge passes idempotencyKey through to Stripe as request options when provided', async () => {
    const gateway = new StripeGateway();

    await gateway.charge({
      amount: 12.5,
      currency: 'usd',
      sourceId: 'pm_1',
      customerId: 'cus_1',
      idempotencyKey: 'idem-key-1',
    });

    expect(paymentIntentsCreateMock).toHaveBeenCalledWith(expect.any(Object), { idempotencyKey: 'idem-key-1' });
  });
});
