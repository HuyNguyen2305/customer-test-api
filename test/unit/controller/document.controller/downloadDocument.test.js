import { jest } from '@jest/globals';

const requireCustomerIdMock = jest.fn();
const createReadStreamMock = jest.fn();

jest.unstable_mockModule('#common/require-customer-id.js', () => ({
  requireCustomerId: requireCustomerIdMock,
}));

jest.unstable_mockModule('node:fs', () => ({
  default: { createReadStream: createReadStreamMock },
  createReadStream: createReadStreamMock,
}));

const { default: DocumentController } = await import('#controller/document.controller.js');
const { UnauthorizedError } = await import('#configs/error.js');

describe('DocumentController.downloadDocument', () => {
  beforeEach(() => {
    requireCustomerIdMock.mockReset();
    createReadStreamMock.mockReset();
  });

  it('streams the file with the correct headers', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const document = { originalFileName: 'contract.pdf', type: 'application/pdf' };
    const stream = { pipe: jest.fn() };
    createReadStreamMock.mockReturnValue(stream);
    const controller = Object.create(DocumentController.prototype);
    controller.documentService = {
      downloadDocument: jest.fn().mockResolvedValue({ document, absolutePath: '/uploads/contract.pdf' }),
    };
    const reply = { header: jest.fn().mockReturnThis(), type: jest.fn().mockReturnThis(), send: jest.fn() };
    const request = { params: { id: 'd1' } };

    await controller.downloadDocument(request, reply);

    expect(controller.documentService.downloadDocument).toHaveBeenCalledWith('d1', 'c1');
    expect(createReadStreamMock).toHaveBeenCalledWith('/uploads/contract.pdf');
    expect(reply.header).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="contract.pdf"');
    expect(reply.type).toHaveBeenCalledWith('application/pdf');
    expect(reply.send).toHaveBeenCalledWith(stream);
  });

  it('rejects when unauthenticated', async () => {
    requireCustomerIdMock.mockImplementation(() => {
      throw new UnauthorizedError('Authentication required');
    });
    const controller = Object.create(DocumentController.prototype);
    controller.documentService = { downloadDocument: jest.fn() };

    await expect(
      controller.downloadDocument({ params: { id: 'd1' } }, { header: jest.fn(), type: jest.fn(), send: jest.fn() }),
    ).rejects.toThrow(UnauthorizedError);
    expect(controller.documentService.downloadDocument).not.toHaveBeenCalled();
  });
});
