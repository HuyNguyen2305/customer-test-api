import { jest } from '@jest/globals';

const createCustomerMock = jest.fn();
const createCardOnFileMock = jest.fn();
const createBankAccountOnFileMock = jest.fn();
const getPaymentGatewayMock = jest.fn(() => ({
  createCustomer: createCustomerMock,
  createCardOnFile: createCardOnFileMock,
  createBankAccountOnFile: createBankAccountOnFileMock,
}));

jest.unstable_mockModule('#common/factory/payment-gateway/payment-gateway.factory.js', () => ({
  getPaymentGateway: getPaymentGatewayMock,
}));

const { default: CustomerPaymentMethodService } = await import('#service/customer-payment-method.service.js');

function buildService({ customer, existingMethods = [] } = {}) {
  const service = Object.create(CustomerPaymentMethodService.prototype);
  service.customerRepository = {
    findById: jest.fn().mockResolvedValue(customer),
    setGatewayCustomerId: jest.fn().mockResolvedValue(undefined),
  };
  service.customerPaymentMethodRepository = {
    listByCustomerId: jest.fn().mockResolvedValue(existingMethods),
    addPaymentMethod: jest.fn().mockResolvedValue({ id: 'pm-new' }),
  };
  return service;
}

describe('CustomerPaymentMethodService.addPaymentMethod', () => {
  beforeEach(() => {
    getPaymentGatewayMock.mockClear();
    createCustomerMock.mockReset().mockResolvedValue('sq_cust_new');
    createCardOnFileMock.mockReset().mockResolvedValue('sq_card_new');
    createBankAccountOnFileMock.mockReset().mockResolvedValue('sq_bank_new');
  });

  it('creates a gateway customer and persists it when the customer has none yet', async () => {
    const customer = {
      id: 'c1',
      firstName: 'Amelia',
      lastName: 'Earhart',
      email: 'a@example.com',
      squareCustomerId: null,
    };
    const service = buildService({ customer });

    await service.addPaymentMethod('c1', { gateway: 'square', nonce: 'cnon_1', cardholderName: 'Amelia Earhart' });

    expect(createCustomerMock).toHaveBeenCalledWith({
      firstName: 'Amelia',
      lastName: 'Earhart',
      email: 'a@example.com',
    });
    expect(service.customerRepository.setGatewayCustomerId).toHaveBeenCalledWith('c1', 'square', 'sq_cust_new');
    expect(createCardOnFileMock).toHaveBeenCalledWith({
      sourceId: 'cnon_1',
      customerId: 'sq_cust_new',
      cardholderName: 'Amelia Earhart',
    });
    expect(service.customerPaymentMethodRepository.addPaymentMethod).toHaveBeenCalledWith({
      customerId: 'c1',
      type: 'card',
      paymentDetails: { token: 'sq_card_new', gateway: 'square', gatewayCustomerId: 'sq_cust_new' },
      isDefault: true,
    });
  });

  it('reuses an existing gateway customer id without creating a new one', async () => {
    const customer = {
      id: 'c1',
      firstName: 'Amelia',
      lastName: 'Earhart',
      email: 'a@example.com',
      squareCustomerId: 'sq_cust_existing',
    };
    const service = buildService({ customer, existingMethods: [{ id: 'pm-old' }] });

    await service.addPaymentMethod('c1', { gateway: 'square', nonce: 'cnon_2' });

    expect(createCustomerMock).not.toHaveBeenCalled();
    expect(service.customerRepository.setGatewayCustomerId).not.toHaveBeenCalled();
    expect(createCardOnFileMock).toHaveBeenCalledWith({
      sourceId: 'cnon_2',
      customerId: 'sq_cust_existing',
      cardholderName: undefined,
    });
  });

  it('is not marked default when the customer already has a payment method', async () => {
    const customer = { id: 'c1', squareCustomerId: 'sq_cust_existing' };
    const service = buildService({ customer, existingMethods: [{ id: 'pm-old' }] });

    await service.addPaymentMethod('c1', { gateway: 'square', nonce: 'cnon_3' });

    expect(service.customerPaymentMethodRepository.addPaymentMethod).toHaveBeenCalledWith(
      expect.objectContaining({ isDefault: false }),
    );
  });

  it('resolves the Stripe gateway and uses stripeCustomerId when gateway is stripe', async () => {
    const customer = { id: 'c1', firstName: 'A', lastName: 'B', email: 'a@example.com', stripeCustomerId: null };
    const service = buildService({ customer });

    await service.addPaymentMethod('c1', { gateway: 'stripe', nonce: 'pm_test_1' });

    expect(getPaymentGatewayMock).toHaveBeenCalledWith('stripe');
    expect(createCustomerMock).toHaveBeenCalledWith({ firstName: 'A', lastName: 'B', email: 'a@example.com' });
  });

  it('creates a bank account on file instead of a card when type is bank', async () => {
    const customer = { id: 'c1', squareCustomerId: 'sq_cust_existing' };
    const service = buildService({ customer });

    await service.addPaymentMethod('c1', { gateway: 'square', type: 'bank', nonce: 'bnon_1' });

    expect(createBankAccountOnFileMock).toHaveBeenCalledWith({ sourceId: 'bnon_1', customerId: 'sq_cust_existing' });
    expect(createCardOnFileMock).not.toHaveBeenCalled();
    expect(service.customerPaymentMethodRepository.addPaymentMethod).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'bank', paymentDetails: expect.objectContaining({ token: 'sq_bank_new' }) }),
    );
  });
});
