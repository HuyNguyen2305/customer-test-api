import { jest } from '@jest/globals';

const chargeMock = jest.fn();
const getPaymentGatewayMock = jest.fn(() => ({ charge: chargeMock }));
const FAKE_TRANSACTION = { id: 'fake-transaction' };
const transactionMock = jest.fn((fn) => fn(FAKE_TRANSACTION));

jest.unstable_mockModule('#common/factory/payment-gateway/payment-gateway.factory.js', () => ({
  getPaymentGateway: getPaymentGatewayMock,
}));

// payBalance() now wraps its post-charge DB writes in sequelize.transaction() -
// this test builds the service with plain mocked repos/no real DB, so the
// transaction runner itself must be stubbed to just invoke its callback.
jest.unstable_mockModule('#common/sequelize.js', () => ({
  sequelize: { transaction: transactionMock },
}));

const { default: BalanceService } = await import('#service/balance.service.js');
const { NotFoundError, BadRequestError } = await import('#configs/error.js');

function buildService({ balance, paymentMethod, newBalance = 0 } = {}) {
  const service = Object.create(BalanceService.prototype);
  service.balanceRepository = {
    getBalance: jest.fn().mockResolvedValue(balance),
    setAmount: jest.fn().mockResolvedValue(undefined),
  };
  service.customerPaymentMethodRepository = {
    getPaymentMethodById: jest.fn().mockResolvedValue(paymentMethod),
    decrementCredit: jest.fn().mockResolvedValue(undefined),
  };
  service.ledgerService = {
    recordPayment: jest.fn().mockResolvedValue(undefined),
    getCustomerBalance: jest.fn().mockResolvedValue(newBalance),
  };
  return service;
}

describe('BalanceService.payBalance', () => {
  beforeEach(() => {
    chargeMock.mockReset().mockResolvedValue({ success: true });
    getPaymentGatewayMock.mockClear();
    transactionMock.mockClear();
  });

  it('charges a Square card, records a ledger payment, and reconciles the balance', async () => {
    const balance = { customerId: 'c1', amount: 100, currency: 'USD' };
    const paidOffBalance = { customerId: 'c1', amount: 0, currency: 'USD' };
    const paymentMethod = {
      id: 'pm1',
      type: 'card',
      gateway: 'square',
      token: 'sq_card_1',
      gatewayCustomerId: 'sq_cust_1',
    };
    const service = buildService({ balance, paymentMethod });
    service.balanceRepository.getBalance.mockResolvedValueOnce(balance).mockResolvedValueOnce(paidOffBalance);

    const result = await service.payBalance('c1', 'pm1');

    expect(service.customerPaymentMethodRepository.getPaymentMethodById).toHaveBeenCalledWith('pm1', 'c1');
    expect(getPaymentGatewayMock).toHaveBeenCalledWith('square');
    expect(chargeMock).toHaveBeenCalledWith({
      amount: 100,
      currency: 'USD',
      sourceId: 'sq_card_1',
      customerId: 'sq_cust_1',
      type: 'card',
      idempotencyKey: expect.any(String),
    });
    expect(service.ledgerService.recordPayment).toHaveBeenCalledWith(
      {
        customerId: 'c1',
        invoiceId: null,
        amount: 100,
      },
      { transaction: FAKE_TRANSACTION },
    );
    expect(service.balanceRepository.setAmount).toHaveBeenCalledWith('c1', 0, { transaction: FAKE_TRANSACTION });
    expect(result).toBe(paidOffBalance);
  });

  it('charges a Stripe card', async () => {
    const balance = { customerId: 'c1', amount: 50, currency: 'USD' };
    const paymentMethod = {
      id: 'pm2',
      type: 'card',
      gateway: 'stripe',
      token: 'pm_stripe_1',
      gatewayCustomerId: 'cus_stripe_1',
    };
    const service = buildService({ balance, paymentMethod });

    await service.payBalance('c1', 'pm2');

    expect(getPaymentGatewayMock).toHaveBeenCalledWith('stripe');
    expect(chargeMock).toHaveBeenCalledWith({
      amount: 50,
      currency: 'USD',
      sourceId: 'pm_stripe_1',
      customerId: 'cus_stripe_1',
      type: 'card',
      idempotencyKey: expect.any(String),
    });
  });

  it('charges a bank account payment method and passes type through to the gateway', async () => {
    const balance = { customerId: 'c1', amount: 75, currency: 'USD' };
    const paymentMethod = {
      id: 'pm4',
      type: 'bank',
      gateway: 'stripe',
      token: 'pm_bank_1',
      gatewayCustomerId: 'cus_stripe_1',
    };
    const service = buildService({ balance, paymentMethod });

    await service.payBalance('c1', 'pm4');

    expect(chargeMock).toHaveBeenCalledWith({
      amount: 75,
      currency: 'USD',
      sourceId: 'pm_bank_1',
      customerId: 'cus_stripe_1',
      type: 'bank',
      idempotencyKey: expect.any(String),
    });
  });

  it('pays via open credit without touching any gateway, when there is enough credit', async () => {
    const balance = { customerId: 'c1', amount: 30, currency: 'USD' };
    const paymentMethod = { id: 'pm3', type: 'open_credit', creditBalance: 50 };
    const service = buildService({ balance, paymentMethod });

    await service.payBalance('c1', 'pm3');

    expect(getPaymentGatewayMock).not.toHaveBeenCalled();
    expect(chargeMock).not.toHaveBeenCalled();
    expect(service.customerPaymentMethodRepository.decrementCredit).toHaveBeenCalledWith('pm3', 30, {
      transaction: FAKE_TRANSACTION,
    });
    expect(service.ledgerService.recordPayment).toHaveBeenCalledWith(
      { customerId: 'c1', invoiceId: null, amount: 30 },
      { transaction: FAKE_TRANSACTION },
    );
  });

  it('throws BadRequestError when open credit is insufficient', async () => {
    const balance = { customerId: 'c1', amount: 100, currency: 'USD' };
    const paymentMethod = { id: 'pm3', type: 'open_credit', creditBalance: 20 };
    const service = buildService({ balance, paymentMethod });

    await expect(service.payBalance('c1', 'pm3')).rejects.toThrow(BadRequestError);
    expect(service.customerPaymentMethodRepository.decrementCredit).not.toHaveBeenCalled();
    expect(service.ledgerService.recordPayment).not.toHaveBeenCalled();
  });

  it('throws BadRequestError and never charges when the balance is zero', async () => {
    const service = buildService({ balance: { customerId: 'c1', amount: 0, currency: 'USD' } });

    await expect(service.payBalance('c1', 'pm1')).rejects.toThrow(BadRequestError);
    expect(chargeMock).not.toHaveBeenCalled();
    expect(service.balanceRepository.setAmount).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when the payment method does not exist', async () => {
    const service = buildService({
      balance: { customerId: 'c1', amount: 50, currency: 'USD' },
      paymentMethod: null,
    });

    await expect(service.payBalance('c1', 'missing')).rejects.toThrow(NotFoundError);
    expect(chargeMock).not.toHaveBeenCalled();
  });

  it('propagates gateway charge failures without recording a payment', async () => {
    const service = buildService({
      balance: { customerId: 'c1', amount: 50, currency: 'USD' },
      paymentMethod: { id: 'pm1', type: 'card', gateway: 'square', token: 'sq_1', gatewayCustomerId: 'sq_cust_1' },
    });
    chargeMock.mockRejectedValueOnce(new Error('card declined'));

    await expect(service.payBalance('c1', 'pm1')).rejects.toThrow('card declined');
    expect(service.ledgerService.recordPayment).not.toHaveBeenCalled();
    expect(service.balanceRepository.setAmount).not.toHaveBeenCalled();
  });

  it('generates a fresh idempotency key per attempt rather than reusing one across calls', async () => {
    const paymentMethod = { id: 'pm1', type: 'card', gateway: 'square', token: 'sq_1', gatewayCustomerId: 'sq_cust_1' };
    const service = buildService({ balance: { customerId: 'c1', amount: 50, currency: 'USD' }, paymentMethod });

    await service.payBalance('c1', 'pm1');
    await service.payBalance('c1', 'pm1');

    const [firstCall, secondCall] = chargeMock.mock.calls;
    expect(firstCall[0].idempotencyKey).toEqual(expect.any(String));
    expect(secondCall[0].idempotencyKey).toEqual(expect.any(String));
    expect(firstCall[0].idempotencyKey).not.toBe(secondCall[0].idempotencyKey);
  });

  it('propagates an error thrown inside the post-charge transaction instead of swallowing it', async () => {
    const service = buildService({
      balance: { customerId: 'c1', amount: 50, currency: 'USD' },
      paymentMethod: { id: 'pm1', type: 'card', gateway: 'square', token: 'sq_1', gatewayCustomerId: 'sq_cust_1' },
    });
    service.ledgerService.recordPayment.mockRejectedValueOnce(new Error('ledger write failed'));

    await expect(service.payBalance('c1', 'pm1')).rejects.toThrow('ledger write failed');
    expect(service.balanceRepository.setAmount).not.toHaveBeenCalled();
  });
});
