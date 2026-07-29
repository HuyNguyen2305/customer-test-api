import { jest } from '@jest/globals';

const getMock = jest.fn();
const createReadStreamMock = jest.fn();

jest.unstable_mockModule('#common/request-context.js', () => ({
  requestContext: { get: getMock },
}));

jest.unstable_mockModule('node:fs', () => ({
  default: { createReadStream: createReadStreamMock },
  createReadStream: createReadStreamMock,
}));

const { default: DocumentController } = await import('#controller/document.controller.js');

describe('DocumentController.downloadDocument', () => {
  beforeEach(() => {
    getMock.mockReset();
    createReadStreamMock.mockReset();
  });

  it('streams the file with the correct headers', async () => {
    getMock.mockReturnValue({ customerId: 'c1' });
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
});
