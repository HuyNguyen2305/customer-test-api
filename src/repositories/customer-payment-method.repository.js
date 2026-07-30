import { BaseRepository } from '#common/base-repository.js';

class CustomerPaymentMethodRepository extends BaseRepository {
  constructor({ customerPaymentMethodModel }) {
    super(customerPaymentMethodModel);
  }

  listByCustomerId(customerId) {
    return this.findAll({ where: { customerId } });
  }
}

export default CustomerPaymentMethodRepository;
