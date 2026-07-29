import { jest } from '@jest/globals';

const { default: DocumentRepository } = await import('#repositories/document.repository.js');

describe('DocumentRepository.downloadDocument', () => {
  it('delegates to getDocumentById', async () => {
    const document = { id: 'd1', customerId: 'c1', filePath: 'abc.pdf' };
    const repository = Object.create(DocumentRepository.prototype);
    repository.getDocumentById = jest.fn().mockResolvedValue(document);

    const result = await repository.downloadDocument('d1', 'c1');

    expect(repository.getDocumentById).toHaveBeenCalledWith('d1', 'c1');
    expect(result).toBe(document);
  });
});
