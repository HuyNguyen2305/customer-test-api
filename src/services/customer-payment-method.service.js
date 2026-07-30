class CustomerPaymentMethodService {
  constructor({ customerPaymentMethodRepository }) {
    this.customerPaymentMethodRepository = customerPaymentMethodRepository;
  }

  listPaymentMethods(customerId) {
    return this.customerPaymentMethodRepository.listByCustomerId(customerId);
  }
}

export default CustomerPaymentMethodService;
