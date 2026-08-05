import { NotFoundError } from '#configs/error.js';
import { getPaymentGateway } from '#common/factory/payment-gateway/payment-gateway.factory.js';

class CustomerPaymentMethodService {
  constructor({ customerPaymentMethodRepository, customerRepository }) {
    this.customerPaymentMethodRepository = customerPaymentMethodRepository;
    this.customerRepository = customerRepository;
  }

  listPaymentMethods(customerId) {
    return this.customerPaymentMethodRepository.listByCustomerId(customerId);
  }

  async setDefault(customerId, id) {
    const paymentMethod = await this.customerPaymentMethodRepository.setDefault(id, customerId);
    if (!paymentMethod) throw new NotFoundError('Payment method not found');
    return paymentMethod;
  }

  async addPaymentMethod(customerId, { gateway, nonce, cardholderName }) {
    const customer = await this.customerRepository.findById(customerId);
    const gatewayClient = getPaymentGateway(gateway);

    let gatewayCustomerId = gateway === 'square' ? customer.squareCustomerId : customer.stripeCustomerId;
    if (!gatewayCustomerId) {
      gatewayCustomerId = await gatewayClient.createCustomer({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
      });
      await this.customerRepository.setGatewayCustomerId(customerId, gateway, gatewayCustomerId);
    }

    const cardId = await gatewayClient.createCardOnFile({
      sourceId: nonce,
      customerId: gatewayCustomerId,
      cardholderName,
    });

    const existing = await this.customerPaymentMethodRepository.listByCustomerId(customerId);
    return this.customerPaymentMethodRepository.addPaymentMethod({
      customerId,
      type: 'card',
      gateway,
      token: cardId,
      gatewayCustomerId,
      isDefault: existing.length === 0,
    });
  }

  grantOpenCredit(customerId, amount) {
    return this.customerPaymentMethodRepository.upsertOpenCredit(customerId, amount);
  }
}

export default CustomerPaymentMethodService;
