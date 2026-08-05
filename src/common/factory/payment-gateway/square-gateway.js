import { randomUUID } from 'node:crypto';
import { SquareClient, SquareEnvironment } from 'square';

export class SquareGateway {
  constructor() {
    this.client = new SquareClient({
      token: process.env.SQUARE_ACCESS_TOKEN,
      environment:
        process.env.SQUARE_ENVIRONMENT === 'production' ? SquareEnvironment.Production : SquareEnvironment.Sandbox,
    });
  }

  async createCustomer({ firstName, lastName, email }) {
    const response = await this.client.customers.create({
      givenName: firstName,
      familyName: lastName,
      emailAddress: email,
    });
    return response.customer.id;
  }

  async createCardOnFile({ sourceId, customerId, cardholderName }) {
    const response = await this.client.cards.create({
      idempotencyKey: randomUUID(),
      sourceId,
      card: { customerId, cardholderName },
    });
    return response.card.id;
  }

  async charge({ amount, currency, sourceId, customerId, locationId }) {
    return this.client.payments.create({
      sourceId,
      customerId,
      idempotencyKey: randomUUID(),
      locationId: locationId ?? process.env.SQUARE_LOCATION_ID,
      amountMoney: {
        amount: BigInt(Math.round(amount * 100)),
        currency,
      },
    });
  }
}

export default SquareGateway;
