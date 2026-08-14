import Stripe from 'stripe';

export class StripeGateway {
  constructor() {
    this.client = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  async createCustomer({ firstName, lastName, email }) {
    const customer = await this.client.customers.create({
      name: [firstName, lastName].filter(Boolean).join(' ') || undefined,
      email,
    });
    return customer.id;
  }

  async createCardOnFile({ sourceId, customerId }) {
    const paymentMethod = await this.client.paymentMethods.attach(sourceId, { customer: customerId });
    return paymentMethod.id;
  }

  async createBankAccountOnFile({ sourceId, customerId }) {
    const paymentMethod = await this.client.paymentMethods.attach(sourceId, { customer: customerId });
    return paymentMethod.id;
  }

  async charge({ amount, currency, sourceId, customerId, type = 'card', idempotencyKey }) {
    return this.client.paymentIntents.create(
      {
        amount: Math.round(amount * 100),
        currency,
        customer: customerId,
        payment_method: sourceId,
        payment_method_types: [type === 'bank' ? 'us_bank_account' : 'card'],
        confirm: true,
        off_session: true,
      },
      idempotencyKey ? { idempotencyKey } : undefined,
    );
  }
}

export default StripeGateway;
