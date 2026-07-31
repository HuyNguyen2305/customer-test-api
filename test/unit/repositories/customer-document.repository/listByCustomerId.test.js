import { jest } from '@jest/globals';

const { default: CustomerDocumentRepository } = await import('#repositories/customer-document.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('CustomerDocumentRepository.listByCustomerId', () => {
  it('queries documents scoped to the customerId, paginated, with library/pdf names eager-loaded', async () => {
    const scopedModel = { findAndCountAll: jest.fn().mockResolvedValue({ rows: [{ id: 'd1' }], count: 1 }) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const scopedLibraryModel = {};
    const scopedPdfModel = {};
    const serviceDocumentLibraryModel = { schema: jest.fn().mockReturnValue(scopedLibraryModel) };
    const pdfModel = { schema: jest.fn().mockReturnValue(scopedPdfModel) };
    const repository = Object.create(CustomerDocumentRepository.prototype);
    repository.model = model;
    repository.serviceDocumentLibraryModel = serviceDocumentLibraryModel;
    repository.pdfModel = pdfModel;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.listByCustomerId('c1', { limit: 20, offset: 0 }),
    );

    expect(scopedModel.findAndCountAll).toHaveBeenCalledWith({
      where: { customerId: 'c1' },
      limit: 20,
      offset: 0,
      order: [['createdAt', 'DESC']],
      include: [{ model: scopedLibraryModel }, { model: scopedPdfModel }],
    });
    expect(result).toEqual({ rows: [{ id: 'd1' }], count: 1 });
  });
});
