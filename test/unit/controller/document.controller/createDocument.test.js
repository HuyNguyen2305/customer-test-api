import { jest } from '@jest/globals';

const getMock = jest.fn();

jest.unstable_mockModule('#common/request-context.js', () => ({
  requestContext: { get: getMock },
}));

const { default: DocumentController } = await import('#controller/document.controller.js');
const { BadRequestError } = await import('#configs/error.js');

describe('DocumentController.createDocument', () => {
  beforeEach(() => getMock.mockReset());

  it('creates the document from the multipart body', async () => {
    getMock.mockReturnValue({ customerId: 'c1' });
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
    getMock.mockReturnValue({ customerId: 'c1' });
    const controller = Object.create(DocumentController.prototype);
    controller.documentService = { createDocument: jest.fn() };
    const reply = { send: jest.fn() };
    const request = { body: { title: { value: 'Contract' } } };

    await expect(controller.createDocument(request, reply)).rejects.toThrow(BadRequestError);
    expect(controller.documentService.createDocument).not.toHaveBeenCalled();
  });
});
