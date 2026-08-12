import { jest } from '@jest/globals';

const { default: CustomerInvoiceRepository } = await import('#repositories/customer-invoice.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('CustomerInvoiceRepository.findByEstimateId', () => {
  it('looks up the invoice by estimateId', async () => {
    const invoice = { id: 'i1', estimateId: 'e1' };
    const scopedModel = { findOne: jest.fn().mockResolvedValue(invoice) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerInvoiceRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.findByEstimateId('e1'),
    );

    expect(scopedModel.findOne).toHaveBeenCalledWith({ where: { estimateId: 'e1' } });
    expect(result).toBe(invoice);
  });

  it('returns null when no invoice has been generated from the estimate yet', async () => {
    const scopedModel = { findOne: jest.fn().mockResolvedValue(null) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(CustomerInvoiceRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.findByEstimateId('e1'),
    );

    expect(result).toBeNull();
  });
});
