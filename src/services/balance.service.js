import { getPaymentGateway } from '#common/factory/payment-gateway/payment-gateway.factory.js';
import { NotFoundError, BadRequestError } from '#configs/error.js';

class BalanceService {
  constructor({ balanceRepository, paymentOptionRepository }) {
    this.balanceRepository = balanceRepository;
    this.paymentOptionRepository = paymentOptionRepository;
  }

  async getBalance(customerId) {
    const balance = await this.balanceRepository.getBalance(customerId);
    if (!balance) throw new NotFoundError('Balance not found');
    return balance;
  }

  async payBalance(customerId, paymentOptionId) {
    const balance = await this.getBalance(customerId);
    const amount = Number(balance.amount);
    if (amount <= 0) throw new BadRequestError('Nothing to pay');

    const paymentOption = await this.paymentOptionRepository.getPaymentOptionById(paymentOptionId, customerId);
    if (!paymentOption) throw new NotFoundError('Payment option not found');

    const gateway = getPaymentGateway(paymentOption.gateway);
    await gateway.charge({
      amount,
      currency: balance.currency,
      externalId: paymentOption.externalId,
    });

    await this.balanceRepository.payOff(customerId);
    return this.getBalance(customerId);
  }
}

export default BalanceService;
