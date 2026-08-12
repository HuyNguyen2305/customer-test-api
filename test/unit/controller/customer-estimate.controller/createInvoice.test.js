import { jest } from '@jest/globals';

const requireCustomerIdMock = jest.fn();

jest.unstable_mockModule('#common/require-customer-id.js', () => ({
  requireCustomerId: requireCustomerIdMock,
}));

const { default: CustomerEstimateController } = await import('#controller/customer-estimate.controller.js');
const { NotFoundError } = await import('#configs/error.js');

describe('CustomerEstimateController.createInvoice', () => {
  beforeEach(() => requireCustomerIdMock.mockReset());

  it('creates an invoice from the estimate for the authenticated customer', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const data = { id: 'inv1', status: 'draft' };
    const controller = Object.create(CustomerEstimateController.prototype);
    controller.customerEstimateService = { createInvoiceFromEstimate: jest.fn().mockResolvedValue(data) };
    const reply = { send: jest.fn() };
    const request = { params: { id: 'e1' } };

    await controller.createInvoice(request, reply);

    expect(controller.customerEstimateService.createInvoiceFromEstimate).toHaveBeenCalledWith('e1', 'c1');
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Invoice created from estimate', data });
  });

  it('propagates NotFoundError when the estimate is not eligible or not owned by the customer', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const controller = Object.create(CustomerEstimateController.prototype);
    controller.customerEstimateService = {
      createInvoiceFromEstimate: jest.fn().mockRejectedValue(new NotFoundError('Estimate not found')),
    };
    const request = { params: { id: 'e1' } };

    await expect(controller.createInvoice(request, { send: jest.fn() })).rejects.toThrow(NotFoundError);
  });
});
