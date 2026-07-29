import { jest } from '@jest/globals';

const getMock = jest.fn();

jest.unstable_mockModule('#common/request-context.js', () => ({
  requestContext: { get: getMock },
}));

const { default: DocumentController } = await import('#controller/document.controller.js');

describe('DocumentController.listDocuments', () => {
  beforeEach(() => getMock.mockReset());

  it('sends the documents and pagination for the identity customerId', async () => {
    getMock.mockReturnValue({ customerId: 'c1' });
    const documents = [{ id: 'd1' }];
    const pagination = { page: 1, pageSize: 20, total: 1, totalPages: 1 };
    const controller = Object.create(DocumentController.prototype);
    controller.documentService = { listDocuments: jest.fn().mockResolvedValue({ documents, pagination }) };
    const reply = { send: jest.fn() };
    const request = { query: { page: 1, pageSize: 20 } };

    await controller.listDocuments(request, reply);

    expect(controller.documentService.listDocuments).toHaveBeenCalledWith('c1', { page: 1, pageSize: 20 });
    expect(reply.send).toHaveBeenCalledWith({
      success: true,
      message: 'Documents retrieved',
      data: documents,
      pagination,
    });
  });

  it('passes undefined customerId when there is no identity', async () => {
    getMock.mockReturnValue(undefined);
    const controller = Object.create(DocumentController.prototype);
    controller.documentService = { listDocuments: jest.fn().mockResolvedValue({ documents: [], pagination: {} }) };
    const reply = { send: jest.fn() };
    const request = { query: {} };

    await controller.listDocuments(request, reply);

    expect(controller.documentService.listDocuments).toHaveBeenCalledWith(undefined, {
      page: undefined,
      pageSize: undefined,
    });
  });
});
