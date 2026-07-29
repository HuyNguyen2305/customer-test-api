import { jest } from '@jest/globals';

const { default: DocumentRepository } = await import('#repositories/document.repository.js');
const { requestContext } = await import('#common/request-context.js');

describe('DocumentRepository.listDocuments', () => {
  it('queries the schema-scoped model with customerId and pagination', async () => {
    const scopedModel = { findAndCountAll: jest.fn().mockResolvedValue({ rows: [{ id: 'd1' }], count: 1 }) };
    const model = { schema: jest.fn().mockReturnValue(scopedModel) };
    const repository = Object.create(DocumentRepository.prototype);
    repository.model = model;

    const result = await requestContext.run(new Map([['identity', { schema: 'tenant_x' }]]), () =>
      repository.listDocuments('c1', { limit: 20, offset: 0 }),
    );

    expect(model.schema).toHaveBeenCalledWith('tenant_x');
    expect(scopedModel.findAndCountAll).toHaveBeenCalledWith({
      where: { customerId: 'c1' },
      limit: 20,
      offset: 0,
      order: [['createdAt', 'DESC']],
    });
    expect(result).toEqual({ rows: [{ id: 'd1' }], count: 1 });
  });

  it('falls back to the plain model when there is no request identity', async () => {
    const model = { findAndCountAll: jest.fn().mockResolvedValue({ rows: [], count: 0 }), schema: jest.fn() };
    const repository = Object.create(DocumentRepository.prototype);
    repository.model = model;

    await repository.listDocuments('c1', {});

    expect(model.schema).not.toHaveBeenCalled();
    expect(model.findAndCountAll).toHaveBeenCalled();
  });
});
