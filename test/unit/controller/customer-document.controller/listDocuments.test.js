import { jest } from '@jest/globals';

const requireCustomerIdMock = jest.fn();

jest.unstable_mockModule('#common/require-customer-id.js', () => ({
  requireCustomerId: requireCustomerIdMock,
}));

const { default: CustomerDocumentController } = await import('#controller/customer-document.controller.js');

describe('CustomerDocumentController.listDocuments', () => {
  beforeEach(() => requireCustomerIdMock.mockReset());

  it('sends documents and pagination for the authenticated customer', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const documents = [{ id: 'd1', type: 'doc', name: 'Contract' }];
    const pagination = { page: 1, pageSize: 20, total: 1, totalPages: 1 };
    const controller = Object.create(CustomerDocumentController.prototype);
    controller.customerDocumentService = { listDocuments: jest.fn().mockResolvedValue({ documents, pagination }) };
    const reply = { send: jest.fn() };
    const request = { query: { page: 1, pageSize: 20 } };

    await controller.listDocuments(request, reply);

    expect(controller.customerDocumentService.listDocuments).toHaveBeenCalledWith('c1', { page: 1, pageSize: 20 });
    expect(reply.send).toHaveBeenCalledWith({
      success: true,
      message: 'Documents retrieved',
      data: documents,
      pagination,
    });
  });
});
