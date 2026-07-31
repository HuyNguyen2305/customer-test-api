import { jest } from '@jest/globals';

const requireCustomerIdMock = jest.fn();

jest.unstable_mockModule('#common/require-customer-id.js', () => ({
  requireCustomerId: requireCustomerIdMock,
}));

const { default: DocumentController } = await import('#controller/document.controller.js');
const { UnauthorizedError } = await import('#configs/error.js');

describe('DocumentController.getDocumentById', () => {
  beforeEach(() => requireCustomerIdMock.mockReset());

  it('sends the document for the identity customerId and params id', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const data = { id: 'd1', title: 'Contract' };
    const controller = Object.create(DocumentController.prototype);
    controller.documentService = { getDocumentById: jest.fn().mockResolvedValue(data) };
    const reply = { send: jest.fn() };
    const request = { params: { id: 'd1' } };

    await controller.getDocumentById(request, reply);

    expect(controller.documentService.getDocumentById).toHaveBeenCalledWith('d1', 'c1');
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Document retrieved', data });
  });

  it('rejects when unauthenticated', async () => {
    requireCustomerIdMock.mockImplementation(() => {
      throw new UnauthorizedError('Authentication required');
    });
    const controller = Object.create(DocumentController.prototype);
    controller.documentService = { getDocumentById: jest.fn() };

    await expect(controller.getDocumentById({ params: { id: 'd1' } }, { send: jest.fn() })).rejects.toThrow(
      UnauthorizedError,
    );
    expect(controller.documentService.getDocumentById).not.toHaveBeenCalled();
  });
});
