import { NotFoundError } from '#configs/error.js';

class CustomerPaymentMethodService {
  constructor({ customerPaymentMethodRepository }) {
    this.customerPaymentMethodRepository = customerPaymentMethodRepository;
  }

  listPaymentMethods(customerId) {
    return this.customerPaymentMethodRepository.listByCustomerId(customerId);
  }

  async setDefault(customerId, id) {
    const paymentMethod = await this.customerPaymentMethodRepository.setDefault(id, customerId);
    if (!paymentMethod) throw new NotFoundError('Payment method not found');
    return paymentMethod;
  }
}

export default CustomerPaymentMethodService;
