import { jest } from '@jest/globals';

const { default: DocumentService } = await import('#service/document.service.js');

describe('DocumentService.listDocuments', () => {
  it('paginates using default page/pageSize and shapes the result', async () => {
    const rows = [{ id: 'd1' }, { id: 'd2' }];
    const service = Object.create(DocumentService.prototype);
    service.documentRepository = { listDocuments: jest.fn().mockResolvedValue({ rows, count: 2 }) };

    const result = await service.listDocuments('c1');

    expect(service.documentRepository.listDocuments).toHaveBeenCalledWith('c1', {
      limit: 20,
      offset: 0,
    });
    expect(result).toEqual({
      documents: rows,
      pagination: { page: 1, pageSize: 20, total: 2, totalPages: 1 },
    });
  });

  it('computes offset and totalPages for a later page', async () => {
    const service = Object.create(DocumentService.prototype);
    service.documentRepository = { listDocuments: jest.fn().mockResolvedValue({ rows: [], count: 45 }) };

    const result = await service.listDocuments('c1', { page: 3, pageSize: 10 });

    expect(service.documentRepository.listDocuments).toHaveBeenCalledWith('c1', {
      limit: 10,
      offset: 20,
    });
    expect(result.pagination).toEqual({ page: 3, pageSize: 10, total: 45, totalPages: 5 });
  });
});
