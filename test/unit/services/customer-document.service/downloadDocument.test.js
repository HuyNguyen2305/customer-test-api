import { jest } from '@jest/globals';

const fileExistsMock = jest.fn();
const getAbsolutePathMock = jest.fn();

jest.unstable_mockModule('#common/storage/local-storage.js', () => ({
  saveFile: jest.fn(),
  getAbsolutePath: getAbsolutePathMock,
  fileExists: fileExistsMock,
}));

const { default: CustomerDocumentService } = await import('#service/customer-document.service.js');
const { NotFoundError } = await import('#configs/error.js');

describe('CustomerDocumentService.downloadDocument', () => {
  beforeEach(() => {
    fileExistsMock.mockReset();
    getAbsolutePathMock.mockReset();
  });

  it('returns the library file and absolute path for a "doc" type document', async () => {
    const serviceDocumentLibrary = { filePath: 'agreement.pdf', originalFileName: 'Agreement.pdf' };
    const customerDocument = { id: 'cd1', type: 'doc', ServiceDocumentLibrary: serviceDocumentLibrary, Pdf: null };
    fileExistsMock.mockResolvedValue(true);
    getAbsolutePathMock.mockReturnValue('/uploads/agreement.pdf');
    const service = Object.create(CustomerDocumentService.prototype);
    service.customerDocumentRepository = { findByIdForCustomer: jest.fn().mockResolvedValue(customerDocument) };

    const result = await service.downloadDocument('cd1', 'c1');

    expect(service.customerDocumentRepository.findByIdForCustomer).toHaveBeenCalledWith('cd1', 'c1');
    expect(fileExistsMock).toHaveBeenCalledWith('agreement.pdf');
    expect(getAbsolutePathMock).toHaveBeenCalledWith('agreement.pdf');
    expect(result).toEqual({ file: serviceDocumentLibrary, absolutePath: '/uploads/agreement.pdf' });
  });

  it('returns the pdf file and absolute path for a "pdf" type document', async () => {
    const pdf = { filePath: 'report.pdf', originalFileName: 'Report.pdf' };
    const customerDocument = { id: 'cd2', type: 'pdf', ServiceDocumentLibrary: null, Pdf: pdf };
    fileExistsMock.mockResolvedValue(true);
    getAbsolutePathMock.mockReturnValue('/uploads/report.pdf');
    const service = Object.create(CustomerDocumentService.prototype);
    service.customerDocumentRepository = { findByIdForCustomer: jest.fn().mockResolvedValue(customerDocument) };

    const result = await service.downloadDocument('cd2', 'c1');

    expect(result).toEqual({ file: pdf, absolutePath: '/uploads/report.pdf' });
  });

  it('throws NotFoundError when the customer document does not exist', async () => {
    const service = Object.create(CustomerDocumentService.prototype);
    service.customerDocumentRepository = { findByIdForCustomer: jest.fn().mockResolvedValue(null) };

    await expect(service.downloadDocument('missing', 'c1')).rejects.toThrow(NotFoundError);
  });

  it('throws NotFoundError when the customer document exists but the file is missing from disk', async () => {
    const serviceDocumentLibrary = { filePath: 'agreement.pdf', originalFileName: 'Agreement.pdf' };
    const customerDocument = { id: 'cd1', type: 'doc', ServiceDocumentLibrary: serviceDocumentLibrary, Pdf: null };
    fileExistsMock.mockResolvedValue(false);
    const service = Object.create(CustomerDocumentService.prototype);
    service.customerDocumentRepository = { findByIdForCustomer: jest.fn().mockResolvedValue(customerDocument) };

    await expect(service.downloadDocument('cd1', 'c1')).rejects.toThrow(NotFoundError);
  });
});
