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

const { default: CustomerDocumentController } = await import('#controller/customer-document.controller.js');
const { UnauthorizedError } = await import('#configs/error.js');

describe('CustomerDocumentController.downloadDocument', () => {
  beforeEach(() => {
    requireCustomerIdMock.mockReset();
    createReadStreamMock.mockReset();
  });

  it('streams the file with the correct headers', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const file = { originalFileName: 'contract.pdf' };
    const stream = { pipe: jest.fn() };
    createReadStreamMock.mockReturnValue(stream);
    const controller = Object.create(CustomerDocumentController.prototype);
    controller.customerDocumentService = {
      downloadDocument: jest.fn().mockResolvedValue({ file, absolutePath: '/uploads/contract.pdf' }),
    };
    const sendResult = Symbol('sendResult');
    const reply = {
      header: jest.fn().mockReturnThis(),
      type: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnValue(sendResult),
    };
    const request = { params: { id: 'cd1' } };

    const result = await controller.downloadDocument(request, reply);

    expect(controller.customerDocumentService.downloadDocument).toHaveBeenCalledWith('cd1', 'c1');
    expect(createReadStreamMock).toHaveBeenCalledWith('/uploads/contract.pdf');
    expect(reply.header).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="contract.pdf"');
    expect(reply.type).toHaveBeenCalledWith('application/pdf');
    expect(reply.send).toHaveBeenCalledWith(stream);
    // Fastify silently drops streamed payloads from an async handler unless the
    // reply.send(...) chain is returned, so this return is load-bearing, not stylistic.
    expect(result).toBe(sendResult);
  });

  it('reports the correct content-type for a .docx file', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const file = { originalFileName: 'estimate-terms.docx' };
    createReadStreamMock.mockReturnValue({ pipe: jest.fn() });
    const controller = Object.create(CustomerDocumentController.prototype);
    controller.customerDocumentService = {
      downloadDocument: jest.fn().mockResolvedValue({ file, absolutePath: '/uploads/estimate-terms.docx' }),
    };
    const reply = {
      header: jest.fn().mockReturnThis(),
      type: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    await controller.downloadDocument({ params: { id: 'cd2' } }, reply);

    expect(reply.type).toHaveBeenCalledWith('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  });

  it('rejects when unauthenticated', async () => {
    requireCustomerIdMock.mockImplementation(() => {
      throw new UnauthorizedError('Authentication required');
    });
    const controller = Object.create(CustomerDocumentController.prototype);
    controller.customerDocumentService = { downloadDocument: jest.fn() };

    await expect(
      controller.downloadDocument({ params: { id: 'cd1' } }, { header: jest.fn(), type: jest.fn(), send: jest.fn() }),
    ).rejects.toThrow(UnauthorizedError);
    expect(controller.customerDocumentService.downloadDocument).not.toHaveBeenCalled();
  });
});
