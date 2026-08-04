import { jest } from '@jest/globals';

const { default: CustomerDocumentRepository } = await import('#repositories/customer-document.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('CustomerDocumentRepository.findByIdForCustomer', () => {
  it('queries a document scoped to the customerId, with library/pdf eager-loaded', async () => {
    const document = { id: 'd1', customerId: 'c1' };
    const scopedModel = { findOne: jest.fn().mockResolvedValue(document) };
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
      repository.findByIdForCustomer('d1', 'c1'),
    );

    expect(scopedModel.findOne).toHaveBeenCalledWith({
      where: { id: 'd1', customerId: 'c1' },
      include: [{ model: scopedLibraryModel }, { model: scopedPdfModel }],
    });
    expect(result).toBe(document);
  });
});
