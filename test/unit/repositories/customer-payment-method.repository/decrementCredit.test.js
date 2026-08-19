import { jest } from '@jest/globals';

const transactionMock = jest.fn();

jest.unstable_mockModule('#common/sequelize.js', () => ({
  sequelize: { transaction: transactionMock },
}));

const { default: CustomerPaymentMethodRepository } =
  await import('#repositories/customer-payment-method.repository.js');
const { requestContext } = await import('#common/request-context.js');

function buildScopedModel(paymentMethod) {
  return {
    findByPk: jest.fn().mockResolvedValue(paymentMethod),
    update: jest.fn().mockResolvedValue([1]),
  };
}

describe('CustomerPaymentMethodRepository.decrementCredit', () => {
  beforeEach(() => {
    transactionMock.mockReset();
  });

  it('reuses an externally supplied transaction instead of opening its own', async () => {
    const paymentMethod = {
      id: 'pm1',
      paymentDetails: { creditBalance: 50, token: 'tok_x', gateway: 'square', gatewayCustomerId: 'sq_cust_x' },
    };
    const scopedModel = buildScopedModel(paymentMethod);
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerPaymentMethodRepository.prototype);
    repository.model = model;
    const externalTransaction = { id: 'external-tx' };

    await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.decrementCredit('pm1', 20, { transaction: externalTransaction }),
    );

    expect(transactionMock).not.toHaveBeenCalled();
    expect(scopedModel.findByPk).toHaveBeenCalledWith('pm1', { transaction: externalTransaction });
    expect(scopedModel.update).toHaveBeenCalledWith(
      {
        paymentDetails: { creditBalance: 30, token: 'tok_x', gateway: 'square', gatewayCustomerId: 'sq_cust_x' },
      },
      { where: { id: 'pm1' }, transaction: externalTransaction },
    );
  });

  it('opens its own transaction when none is provided', async () => {
    const paymentMethod = {
      id: 'pm1',
      paymentDetails: { creditBalance: 50, token: 'tok_x', gateway: 'square', gatewayCustomerId: 'sq_cust_x' },
    };
    const scopedModel = buildScopedModel(paymentMethod);
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerPaymentMethodRepository.prototype);
    repository.model = model;
    const ownTransaction = { id: 'own-tx' };
    transactionMock.mockImplementation((fn) => fn(ownTransaction));

    await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.decrementCredit('pm1', 20),
    );

    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(scopedModel.findByPk).toHaveBeenCalledWith('pm1', { transaction: ownTransaction });
  });
});
