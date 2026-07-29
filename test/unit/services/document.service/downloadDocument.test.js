import { jest } from '@jest/globals';

const fileExistsMock = jest.fn();
const getAbsolutePathMock = jest.fn();

jest.unstable_mockModule('#common/storage/local-storage.js', () => ({
  saveFile: jest.fn(),
  getAbsolutePath: getAbsolutePathMock,
  fileExists: fileExistsMock,
}));

const { default: DocumentService } = await import('#service/document.service.js');
const { NotFoundError } = await import('#configs/error.js');

describe('DocumentService.downloadDocument', () => {
  beforeEach(() => {
    fileExistsMock.mockReset();
    getAbsolutePathMock.mockReset();
  });

  it('returns the document and absolute path when the file exists on disk', async () => {
    const document = { id: 'd1', customerId: 'c1', filePath: 'abc.pdf' };
    fileExistsMock.mockResolvedValue(true);
    getAbsolutePathMock.mockReturnValue('/uploads/abc.pdf');
    const service = Object.create(DocumentService.prototype);
    service.documentRepository = { downloadDocument: jest.fn().mockResolvedValue(document) };

    const result = await service.downloadDocument('d1', 'c1');

    expect(fileExistsMock).toHaveBeenCalledWith('abc.pdf');
    expect(getAbsolutePathMock).toHaveBeenCalledWith('abc.pdf');
    expect(result).toEqual({ document, absolutePath: '/uploads/abc.pdf' });
  });

  it('throws NotFoundError when the document record does not exist', async () => {
    const service = Object.create(DocumentService.prototype);
    service.documentRepository = { downloadDocument: jest.fn().mockResolvedValue(null) };

    await expect(service.downloadDocument('missing', 'c1')).rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError when the document record exists but the file is missing from disk', async () => {
    const document = { id: 'd1', customerId: 'c1', filePath: 'abc.pdf' };
    fileExistsMock.mockResolvedValue(false);
    const service = Object.create(DocumentService.prototype);
    service.documentRepository = { downloadDocument: jest.fn().mockResolvedValue(document) };

    await expect(service.downloadDocument('d1', 'c1')).rejects.toThrow(NotFoundError);
  });
});
