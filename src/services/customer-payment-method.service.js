import { NotFoundError } from '#configs/error.js';
import { getPaymentGateway } from '#common/factory/payment-gateway/payment-gateway.factory.js';
import { toNumberOrNull } from './billing-calculation.util.js';

// Postgres DECIMAL columns come back from Sequelize as strings; creditBalance
// reaches a nullable-number response field, which fast-json-stringify checks
// strictly rather than coercing (same rationale as billing-calculation.util.js).
export function toPaymentMethodData(paymentMethod) {
  return {
    id: paymentMethod.id,
    type: paymentMethod.type,
    token: paymentMethod.paymentDetails?.token ?? null,
    gateway: paymentMethod.paymentDetails?.gateway ?? null,
    creditBalance: toNumberOrNull(paymentMethod.paymentDetails?.creditBalance),
    isDefault: paymentMethod.isDefault,
  };
}

class CustomerPaymentMethodService {
  constructor({ customerPaymentMethodRepository, customerRepository }) {
    this.customerPaymentMethodRepository = customerPaymentMethodRepository;
    this.customerRepository = customerRepository;
  }

  async listPaymentMethods(customerId) {
    const paymentMethods = await this.customerPaymentMethodRepository.listByCustomerId(customerId);
    return paymentMethods.map(toPaymentMethodData);
  }

  async setDefault(customerId, id) {
    const paymentMethod = await this.customerPaymentMethodRepository.setDefault(id, customerId);
    if (!paymentMethod) throw new NotFoundError('Payment method not found');
    return toPaymentMethodData(paymentMethod);
  }

  async addPaymentMethod(customerId, { gateway, type = 'card', nonce, cardholderName }) {
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

    const onFileId =
      type === 'bank'
        ? await gatewayClient.createBankAccountOnFile({ sourceId: nonce, customerId: gatewayCustomerId })
        : await gatewayClient.createCardOnFile({ sourceId: nonce, customerId: gatewayCustomerId, cardholderName });

    const existing = await this.customerPaymentMethodRepository.listByCustomerId(customerId);
    const created = await this.customerPaymentMethodRepository.addPaymentMethod({
      customerId,
      type,
      paymentDetails: { token: onFileId, gateway, gatewayCustomerId },
      isDefault: existing.length === 0,
    });
    return toPaymentMethodData(created);
  }

  grantOpenCredit(customerId, amount) {
    return this.customerPaymentMethodRepository.upsertOpenCredit(customerId, amount);
  }
}

export default CustomerPaymentMethodService;
