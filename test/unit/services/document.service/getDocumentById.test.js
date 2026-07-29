import { jest } from '@jest/globals';

const { default: DocumentService } = await import('#service/document.service.js');
const { NotFoundError } = await import('#configs/error.js');

describe('DocumentService.getDocumentById', () => {
  it('returns the document from the repository', async () => {
    const document = { id: 'd1', customerId: 'c1', title: 'Contract' };
    const service = Object.create(DocumentService.prototype);
    service.documentRepository = { getDocumentById: jest.fn().mockResolvedValue(document) };

    const result = await service.getDocumentById('d1', 'c1');

    expect(service.documentRepository.getDocumentById).toHaveBeenCalledWith('d1', 'c1');
    expect(result).toBe(document);
  });

  it('throws NotFoundError when no document exists', async () => {
    const service = Object.create(DocumentService.prototype);
    service.documentRepository = { getDocumentById: jest.fn().mockResolvedValue(null) };

    await expect(service.getDocumentById('missing', 'c1')).rejects.toThrow(NotFoundError);
  });
});
