import { jest } from '@jest/globals';

const { default: DocumentRepository } = await import('#repositories/document.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('DocumentRepository.createDocument', () => {
  it('creates the document on the schema-scoped model', async () => {
    const created = { id: 'd1', customerId: 'c1', title: 'Contract' };
    const scopedModel = { create: jest.fn().mockResolvedValue(created) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(DocumentRepository.prototype);
    repository.model = model;
    const data = { customerId: 'c1', title: 'Contract', filePath: 'x.pdf', originalFileName: 'x.pdf', fileSize: 10 };

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.createDocument(data),
    );

    expect(model.schema).toHaveBeenCalledWith('tenant_x');
    expect(scopedModel.create).toHaveBeenCalledWith(data, undefined);
    expect(result).toEqual(created);
  });
});
