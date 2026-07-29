import Stripe from 'stripe';

export class StripeGateway {
  constructor() {
    this.client = new Stripe(process.env.STRIPE_SECRET_KEY);
  }

  async charge({ amount, currency, externalId }) {
    return this.client.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      payment_method: externalId,
      confirm: true,
      off_session: true,
    });
  }
}

export default StripeGateway;
