import { getPaymentGateway } from '#common/factory/payment-gateway/payment-gateway.factory.js';
import { NotFoundError, BadRequestError } from '#configs/error.js';

class BalanceService {
  constructor({ balanceRepository, customerPaymentMethodRepository, ledgerService }) {
    this.balanceRepository = balanceRepository;
    this.customerPaymentMethodRepository = customerPaymentMethodRepository;
    this.ledgerService = ledgerService;
  }

  async getBalance(customerId) {
    const balance = await this.balanceRepository.getBalance(customerId);
    if (!balance) throw new NotFoundError('Balance not found');
    return balance;
  }

  async payBalance(customerId, paymentMethodId) {
    const balance = await this.getBalance(customerId);
    const amount = Number(balance.amount);
    if (amount <= 0) throw new BadRequestError('Nothing to pay');

    const paymentMethod = await this.customerPaymentMethodRepository.getPaymentMethodById(paymentMethodId, customerId);
    if (!paymentMethod) throw new NotFoundError('Payment method not found');

    if (paymentMethod.type === 'open_credit') {
      if (Number(paymentMethod.creditBalance) < amount) throw new BadRequestError('Insufficient open credit');
      await this.customerPaymentMethodRepository.decrementCredit(paymentMethod.id, amount);
    } else {
      const gateway = getPaymentGateway(paymentMethod.gateway);
      await gateway.charge({
        amount,
        currency: balance.currency,
        sourceId: paymentMethod.token,
        customerId: paymentMethod.gatewayCustomerId,
        type: paymentMethod.type,
      });
    }

    await this.ledgerService.recordPayment({ customerId, invoiceId: null, amount });
    const newBalance = await this.ledgerService.getCustomerBalance(customerId);
    await this.balanceRepository.setAmount(customerId, newBalance);

    return this.getBalance(customerId);
  }
}

export default BalanceService;
