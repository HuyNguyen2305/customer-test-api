import { jest } from '@jest/globals';

const requireCustomerIdMock = jest.fn();

jest.unstable_mockModule('#common/require-customer-id.js', () => ({
  requireCustomerId: requireCustomerIdMock,
}));

const { default: DocumentController } = await import('#controller/document.controller.js');
const { UnauthorizedError } = await import('#configs/error.js');

describe('DocumentController.listDocuments', () => {
  beforeEach(() => requireCustomerIdMock.mockReset());

  it('sends the documents and pagination for the identity customerId', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
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

  it('rejects when unauthenticated', async () => {
    requireCustomerIdMock.mockImplementation(() => {
      throw new UnauthorizedError('Authentication required');
    });
    const controller = Object.create(DocumentController.prototype);
    controller.documentService = { listDocuments: jest.fn() };

    await expect(controller.listDocuments({ query: {} }, { send: jest.fn() })).rejects.toThrow(UnauthorizedError);
    expect(controller.documentService.listDocuments).not.toHaveBeenCalled();
  });
});
