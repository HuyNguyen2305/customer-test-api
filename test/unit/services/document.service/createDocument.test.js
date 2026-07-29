import { jest } from '@jest/globals';

const saveFileMock = jest.fn();

jest.unstable_mockModule('#common/storage/local-storage.js', () => ({
  saveFile: saveFileMock,
  getAbsolutePath: jest.fn(),
  fileExists: jest.fn(),
}));

const { default: DocumentService } = await import('#service/document.service.js');
const { BadRequestError } = await import('#configs/error.js');

describe('DocumentService.createDocument', () => {
  beforeEach(() => saveFileMock.mockReset());

  it('saves the file and creates the document record', async () => {
    saveFileMock.mockResolvedValue({ filePath: 'uuid-contract.pdf', fileSize: 1024 });
    const created = { id: 'd1', customerId: 'c1', title: 'Contract' };
    const service = Object.create(DocumentService.prototype);
    service.documentRepository = { createDocument: jest.fn().mockResolvedValue(created) };
    const fileStream = { pipe: jest.fn() };

    const result = await service.createDocument('c1', {
      title: 'Contract',
      type: 'application/pdf',
      fileStream,
      originalFileName: 'contract.pdf',
    });

    expect(saveFileMock).toHaveBeenCalledWith(fileStream, 'contract.pdf');
    expect(service.documentRepository.createDocument).toHaveBeenCalledWith({
      customerId: 'c1',
      title: 'Contract',
      type: 'application/pdf',
      filePath: 'uuid-contract.pdf',
      originalFileName: 'contract.pdf',
      fileSize: 1024,
    });
    expect(result).toBe(created);
  });

  it('throws BadRequestError when no file is provided', async () => {
    const service = Object.create(DocumentService.prototype);
    service.documentRepository = { createDocument: jest.fn() };

    await expect(service.createDocument('c1', { title: 'Contract' })).rejects.toThrow(BadRequestError);
    expect(saveFileMock).not.toHaveBeenCalled();
    expect(service.documentRepository.createDocument).not.toHaveBeenCalled();
  });
});
