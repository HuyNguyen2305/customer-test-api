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

  async charge({ amount, currency, sourceId, customerId }) {
    return this.client.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      customer: customerId,
      payment_method: sourceId,
      confirm: true,
      off_session: true,
    });
  }
}

export default StripeGateway;
