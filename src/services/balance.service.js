import { randomUUID } from 'node:crypto';
import { sequelize } from '#common/sequelize.js';
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

  // Records the ledger payment + reconciles Balance.amount as one atomic
  // unit - previously these were three unwrapped calls, so a failure
  // partway through could leave a ledger entry with no matching balance
  // update (or vice versa for open_credit's decrement).
  async recordPaymentAndReconcile({ customerId, amount, transaction }) {
    await this.ledgerService.recordPayment({ customerId, invoiceId: null, amount }, { transaction });
    const newBalance = await this.ledgerService.getCustomerBalance(customerId, { transaction });
    await this.balanceRepository.setAmount(customerId, newBalance, { transaction });
  }

  async payBalance(customerId, paymentMethodId) {
    const balance = await this.getBalance(customerId);
    const amount = Number(balance.amount);
    if (amount <= 0) throw new BadRequestError('Nothing to pay');

    const paymentMethod = await this.customerPaymentMethodRepository.getPaymentMethodById(paymentMethodId, customerId);
    if (!paymentMethod) throw new NotFoundError('Payment method not found');

    if (paymentMethod.type === 'open_credit') {
      if (Number(paymentMethod.paymentDetails?.creditBalance) < amount)
        throw new BadRequestError('Insufficient open credit');

      // Pure DB path: the credit decrement joins the same transaction as the
      // ledger/balance writes below, so all four writes commit or roll back together.
      await sequelize.transaction(async (transaction) => {
        await this.customerPaymentMethodRepository.decrementCredit(paymentMethod.id, amount, { transaction });
        await this.recordPaymentAndReconcile({ customerId, amount, transaction });
      });
    } else {
      // The gateway charge is an external network call, so it stays outside
      // any DB transaction - holding one open across a round-trip would tie
      // up a pool connection (and any row locks) for no reason. A single
      // idempotencyKey per attempt protects against the gateway SDK's own
      // network-level retries double-charging for this one call.
      const idempotencyKey = randomUUID();
      const gateway = getPaymentGateway(paymentMethod.paymentDetails?.gateway);
      await gateway.charge({
        amount,
        currency: balance.currency,
        sourceId: paymentMethod.paymentDetails?.token,
        customerId: paymentMethod.paymentDetails?.gatewayCustomerId,
        type: paymentMethod.type,
        idempotencyKey,
      });

      await sequelize.transaction(async (transaction) => {
        await this.recordPaymentAndReconcile({ customerId, amount, transaction });
      });
    }

    return this.getBalance(customerId);
  }
}

export default BalanceService;
