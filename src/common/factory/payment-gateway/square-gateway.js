import { randomUUID } from 'node:crypto';
import { SquareClient } from 'square';

export class SquareGateway {
  constructor() {
    this.client = new SquareClient({ token: process.env.SQUARE_ACCESS_TOKEN });
  }

  async charge({ amount, currency, externalId }) {
    return this.client.payments.create({
      sourceId: externalId,
      idempotencyKey: randomUUID(),
      amountMoney: {
        amount: BigInt(Math.round(amount * 100)),
        currency,
      },
    });
  }
}

export default SquareGateway;
