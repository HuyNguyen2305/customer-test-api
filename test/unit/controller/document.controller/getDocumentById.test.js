import { jest } from '@jest/globals';

const getMock = jest.fn();

jest.unstable_mockModule('#common/request-context.js', () => ({
  requestContext: { get: getMock },
}));

const { default: DocumentController } = await import('#controller/document.controller.js');

describe('DocumentController.getDocumentById', () => {
  beforeEach(() => getMock.mockReset());

  it('sends the document for the identity customerId and params id', async () => {
    getMock.mockReturnValue({ customerId: 'c1' });
    const data = { id: 'd1', title: 'Contract' };
    const controller = Object.create(DocumentController.prototype);
    controller.documentService = { getDocumentById: jest.fn().mockResolvedValue(data) };
    const reply = { send: jest.fn() };
    const request = { params: { id: 'd1' } };

    await controller.getDocumentById(request, reply);

    expect(controller.documentService.getDocumentById).toHaveBeenCalledWith('d1', 'c1');
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Document retrieved', data });
  });

  it('passes undefined customerId when there is no identity', async () => {
    getMock.mockReturnValue(undefined);
    const controller = Object.create(DocumentController.prototype);
    controller.documentService = { getDocumentById: jest.fn().mockResolvedValue({}) };
    const reply = { send: jest.fn() };
    const request = { params: { id: 'd1' } };

    await controller.getDocumentById(request, reply);

    expect(controller.documentService.getDocumentById).toHaveBeenCalledWith('d1', undefined);
  });
});
