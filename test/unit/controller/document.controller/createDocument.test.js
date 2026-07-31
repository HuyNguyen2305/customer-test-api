import { jest } from '@jest/globals';

const requireCustomerIdMock = jest.fn();

jest.unstable_mockModule('#common/require-customer-id.js', () => ({
  requireCustomerId: requireCustomerIdMock,
}));

const { default: DocumentController } = await import('#controller/document.controller.js');
const { BadRequestError, UnauthorizedError } = await import('#configs/error.js');

describe('DocumentController.createDocument', () => {
  beforeEach(() => requireCustomerIdMock.mockReset());

  it('creates the document from the multipart body', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const data = { id: 'd1', title: 'Contract' };
    const controller = Object.create(DocumentController.prototype);
    controller.documentService = { createDocument: jest.fn().mockResolvedValue(data) };
    const reply = { send: jest.fn() };
    const fileStream = {};
    const request = {
      body: {
        title: { value: 'Contract' },
        file: { file: fileStream, filename: 'contract.pdf', mimetype: 'application/pdf' },
      },
    };

    await controller.createDocument(request, reply);

    expect(controller.documentService.createDocument).toHaveBeenCalledWith('c1', {
      title: 'Contract',
      type: 'application/pdf',
      fileStream,
      originalFileName: 'contract.pdf',
    });
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Document created', data });
  });

  it('throws BadRequestError when no file part is present', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const controller = Object.create(DocumentController.prototype);
    controller.documentService = { createDocument: jest.fn() };
    const reply = { send: jest.fn() };
    const request = { body: { title: { value: 'Contract' } } };

    await expect(controller.createDocument(request, reply)).rejects.toThrow(BadRequestError);
    expect(controller.documentService.createDocument).not.toHaveBeenCalled();
  });

  it('rejects when unauthenticated', async () => {
    requireCustomerIdMock.mockImplementation(() => {
      throw new UnauthorizedError('Authentication required');
    });
    const controller = Object.create(DocumentController.prototype);
    controller.documentService = { createDocument: jest.fn() };
    const request = {
      body: { title: { value: 'Contract' }, file: { file: {}, filename: 'contract.pdf', mimetype: 'application/pdf' } },
    };

    await expect(controller.createDocument(request, { send: jest.fn() })).rejects.toThrow(UnauthorizedError);
    expect(controller.documentService.createDocument).not.toHaveBeenCalled();
  });
});
