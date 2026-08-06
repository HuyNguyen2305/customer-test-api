import { jest } from '@jest/globals';

const customersCreateMock = jest.fn();
const cardsCreateMock = jest.fn();
const bankAccountsCreateBankAccountMock = jest.fn();
const paymentsCreateMock = jest.fn();

class FakeSquareClient {
  constructor(options) {
    FakeSquareClient.lastOptions = options;
    this.customers = { create: customersCreateMock };
    this.cards = { create: cardsCreateMock };
    // Square's SDK names this method createBankAccount, not create (unlike cards/customers) —
    // keep the mock's shape matching the real client so a wrong method name fails the test.
    this.bankAccounts = { createBankAccount: bankAccountsCreateBankAccountMock };
    this.payments = { create: paymentsCreateMock };
  }
}

jest.unstable_mockModule('square', () => ({
  SquareClient: FakeSquareClient,
  SquareEnvironment: { Production: 'production', Sandbox: 'sandbox' },
}));

const { default: SquareGateway } = await import('#common/factory/payment-gateway/square-gateway.js');

describe('SquareGateway', () => {
  beforeEach(() => {
    customersCreateMock.mockReset().mockResolvedValue({ customer: { id: 'sq_cust_1' } });
    cardsCreateMock.mockReset().mockResolvedValue({ card: { id: 'sq_card_1' } });
    bankAccountsCreateBankAccountMock.mockReset().mockResolvedValue({ bankAccount: { id: 'sq_bank_1' } });
    paymentsCreateMock.mockReset().mockResolvedValue({ payment: { id: 'sq_pay_1' } });
  });

  it('defaults to the Sandbox environment', () => {
    delete process.env.SQUARE_ENVIRONMENT;
    new SquareGateway();
    expect(FakeSquareClient.lastOptions.environment).toBe('sandbox');
  });

  it('createCustomer maps first/last name and email to Square fields and returns the id', async () => {
    const gateway = new SquareGateway();

    const id = await gateway.createCustomer({ firstName: 'Amelia', lastName: 'Earhart', email: 'a@example.com' });

    expect(customersCreateMock).toHaveBeenCalledWith({
      givenName: 'Amelia',
      familyName: 'Earhart',
      emailAddress: 'a@example.com',
    });
    expect(id).toBe('sq_cust_1');
  });

  it('createCardOnFile exchanges a nonce for a card id tied to the gateway customer', async () => {
    const gateway = new SquareGateway();

    const id = await gateway.createCardOnFile({
      sourceId: 'cnon_1',
      customerId: 'sq_cust_1',
      cardholderName: 'Amelia Earhart',
    });

    expect(cardsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceId: 'cnon_1',
        card: { customerId: 'sq_cust_1', cardholderName: 'Amelia Earhart' },
      }),
    );
    expect(id).toBe('sq_card_1');
  });

  it('createBankAccountOnFile exchanges a token for a bank account id tied to the gateway customer', async () => {
    const gateway = new SquareGateway();

    const id = await gateway.createBankAccountOnFile({ sourceId: 'bnon_1', customerId: 'sq_cust_1' });

    expect(bankAccountsCreateBankAccountMock).toHaveBeenCalledWith(
      expect.objectContaining({ sourceId: 'bnon_1', customerId: 'sq_cust_1' }),
    );
    expect(id).toBe('sq_bank_1');
  });

  it('charge sends amountMoney in the smallest currency unit and includes locationId/customerId', async () => {
    process.env.SQUARE_LOCATION_ID = 'loc_1';
    const gateway = new SquareGateway();

    await gateway.charge({ amount: 12.5, currency: 'USD', sourceId: 'sq_card_1', customerId: 'sq_cust_1' });

    expect(paymentsCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceId: 'sq_card_1',
        customerId: 'sq_cust_1',
        locationId: 'loc_1',
        amountMoney: { amount: 1250n, currency: 'USD' },
      }),
    );
  });
});
