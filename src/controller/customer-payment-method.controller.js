import { requireCustomerId } from '#common/require-customer-id.js';

class CustomerPaymentMethodController {
  constructor({ customerPaymentMethodService }) {
    this.customerPaymentMethodService = customerPaymentMethodService;
  }

  async listPaymentMethods(request, reply) {
    const customerId = requireCustomerId();
    const data = await this.customerPaymentMethodService.listPaymentMethods(customerId);
    reply.send({ success: true, message: 'Payment methods retrieved', data });
  }

  async setDefault(request, reply) {
    const customerId = requireCustomerId();
    const data = await this.customerPaymentMethodService.setDefault(customerId, request.params.id);
    reply.send({ success: true, message: 'Default payment method updated', data });
  }

  async addPaymentMethod(request, reply) {
    const customerId = requireCustomerId();
    const { gateway, nonce, cardholderName } = request.body;
    const data = await this.customerPaymentMethodService.addPaymentMethod(customerId, {
      gateway,
      nonce,
      cardholderName,
    });
    reply.send({ success: true, message: 'Payment method added', data });
  }
}

export default CustomerPaymentMethodController;
