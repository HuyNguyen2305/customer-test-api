import { jest } from '@jest/globals';

const requireCustomerIdMock = jest.fn();

jest.unstable_mockModule('#common/require-customer-id.js', () => ({
  requireCustomerId: requireCustomerIdMock,
}));

const { default: CustomerEstimateController } = await import('#controller/customer-estimate.controller.js');
const { UnauthorizedError } = await import('#configs/error.js');

describe('CustomerEstimateController.getEstimatePdf', () => {
  beforeEach(() => {
    requireCustomerIdMock.mockReset();
  });

  it('streams the generated PDF inline with the correct headers', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const buffer = Buffer.from('%PDF-fake');
    const controller = Object.create(CustomerEstimateController.prototype);
    controller.estimatePdfService = { getEstimatePdf: jest.fn().mockResolvedValue({ buffer }) };
    const sendResult = Symbol('sendResult');
    const reply = {
      header: jest.fn().mockReturnThis(),
      type: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnValue(sendResult),
    };
    const request = { params: { id: 'e1' } };

    const result = await controller.getEstimatePdf(request, reply);

    expect(controller.estimatePdfService.getEstimatePdf).toHaveBeenCalledWith('e1', 'c1');
    expect(reply.header).toHaveBeenCalledWith('Content-Disposition', 'inline; filename="estimate-e1.pdf"');
    expect(reply.type).toHaveBeenCalledWith('application/pdf');
    expect(reply.send).toHaveBeenCalledWith(buffer);
    expect(result).toBe(sendResult);
  });

  it('rejects when unauthenticated', async () => {
    requireCustomerIdMock.mockImplementation(() => {
      throw new UnauthorizedError('Authentication required');
    });
    const controller = Object.create(CustomerEstimateController.prototype);
    controller.estimatePdfService = { getEstimatePdf: jest.fn() };

    await expect(
      controller.getEstimatePdf({ params: { id: 'e1' } }, { header: jest.fn(), type: jest.fn(), send: jest.fn() }),
    ).rejects.toThrow(UnauthorizedError);
    expect(controller.estimatePdfService.getEstimatePdf).not.toHaveBeenCalled();
  });
});
