import { BaseRepository } from '#common/base-repository.js';

class PaymentOptionRepository extends BaseRepository {
  constructor({ paymentOptionModel }) {
    super(paymentOptionModel);
  }

  listPaymentOptions() {}
  addPaymentOption() {}
  removePaymentOption() {}
  setDefaultPaymentOption() {}

  getPaymentOptionById(id, customerId) {
    return this.findOne({ where: { id, customerId } });
  }
}

export default PaymentOptionRepository;
