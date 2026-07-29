import { StripeGateway } from './stripe-gateway.js';
import { SquareGateway } from './square-gateway.js';
import { BadRequestError } from '#configs/error.js';

export function getPaymentGateway(gateway) {
  switch (gateway) {
    case 'stripe':
      return new StripeGateway();
    case 'square':
      return new SquareGateway();
    default:
      throw new BadRequestError(`Unsupported payment gateway: ${gateway}`);
  }
}

export default getPaymentGateway;
