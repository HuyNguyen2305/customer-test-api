import { jest } from '@jest/globals';

const chargeMock = jest.fn();
const getPaymentGatewayMock = jest.fn(() => ({ charge: chargeMock }));

jest.unstable_mockModule('#common/factory/payment-gateway/payment-gateway.factory.js', () => ({
  getPaymentGateway: getPaymentGatewayMock,
}));

const { default: BalanceService } = await import('#service/balance.service.js');
const { NotFoundError, BadRequestError } = await import('#configs/error.js');

function buildService({ balance, paymentOption } = {}) {
  const service = Object.create(BalanceService.prototype);
  service.balanceRepository = {
    getBalance: jest.fn().mockResolvedValue(balance),
    payOff: jest.fn().mockResolvedValue(undefined),
  };
  service.paymentOptionRepository = {
    getPaymentOptionById: jest.fn().mockResolvedValue(paymentOption),
  };
  return service;
}

describe('BalanceService.payBalance', () => {
  beforeEach(() => {
    chargeMock.mockReset().mockResolvedValue({ success: true });
    getPaymentGatewayMock.mockClear();
  });

  it('charges the gateway, pays off the balance, and returns the refreshed balance', async () => {
    const balance = { customerId: 'c1', amount: 100, currency: 'USD' };
    const paidOffBalance = { customerId: 'c1', amount: 0, currency: 'USD' };
    const paymentOption = { id: 'po1', gateway: 'stripe', externalId: 'pm_123' };
    const service = buildService({ balance, paymentOption });
    service.balanceRepository.getBalance.mockResolvedValueOnce(balance).mockResolvedValueOnce(paidOffBalance);

    const result = await service.payBalance('c1', 'po1');

    expect(service.paymentOptionRepository.getPaymentOptionById).toHaveBeenCalledWith('po1', 'c1');
    expect(getPaymentGatewayMock).toHaveBeenCalledWith('stripe');
    expect(chargeMock).toHaveBeenCalledWith({ amount: 100, currency: 'USD', externalId: 'pm_123' });
    expect(service.balanceRepository.payOff).toHaveBeenCalledWith('c1');
    expect(result).toBe(paidOffBalance);
  });

  it('throws BadRequestError and never charges when the balance is zero', async () => {
    const service = buildService({ balance: { customerId: 'c1', amount: 0, currency: 'USD' } });

    await expect(service.payBalance('c1', 'po1')).rejects.toThrow(BadRequestError);
    expect(chargeMock).not.toHaveBeenCalled();
    expect(service.balanceRepository.payOff).not.toHaveBeenCalled();
  });

  it('throws NotFoundError when the payment option does not exist', async () => {
    const service = buildService({
      balance: { customerId: 'c1', amount: 50, currency: 'USD' },
      paymentOption: null,
    });

    await expect(service.payBalance('c1', 'missing')).rejects.toThrow(NotFoundError);
    expect(chargeMock).not.toHaveBeenCalled();
  });

  it('propagates gateway charge failures without paying off the balance', async () => {
    const service = buildService({
      balance: { customerId: 'c1', amount: 50, currency: 'USD' },
      paymentOption: { id: 'po1', gateway: 'square', externalId: 'ext_1' },
    });
    chargeMock.mockRejectedValueOnce(new Error('card declined'));

    await expect(service.payBalance('c1', 'po1')).rejects.toThrow('card declined');
    expect(service.balanceRepository.payOff).not.toHaveBeenCalled();
  });
});
