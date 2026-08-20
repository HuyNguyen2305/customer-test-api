import { jest } from '@jest/globals';

const { default: InvoiceFrequencyRepository } = await import('#repositories/invoice-frequency.repository.js');
const { requestContext } = await import('#common/request-context.js');
const { Op } = await import('sequelize');

describe('InvoiceFrequencyRepository.findAllActiveRecurring', () => {
  it('scopes the ServiceInvoice include to the tenant schema', async () => {
    const scopedServiceInvoiceModel = {};
    const scopedModel = { findAll: jest.fn().mockResolvedValue([{ id: 'f1' }]) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const serviceInvoiceModel = { schema: jest.fn().mockReturnValue(scopedServiceInvoiceModel) };
    const repository = Object.create(InvoiceFrequencyRepository.prototype);
    repository.model = model;
    repository.serviceInvoiceModel = serviceInvoiceModel;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.findAllActiveRecurring(),
    );

    expect(serviceInvoiceModel.schema).toHaveBeenCalledWith('tenant_x');
    expect(scopedModel.findAll).toHaveBeenCalledWith({
      where: { 'recurrenceRule.repeatType': { [Op.ne]: 'does_not_repeat' } },
      include: [{ model: scopedServiceInvoiceModel }],
    });
    expect(result).toEqual([{ id: 'f1' }]);
  });
});
