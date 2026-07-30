import { jest } from '@jest/globals';

const requireCustomerIdMock = jest.fn();

jest.unstable_mockModule('#common/require-customer-id.js', () => ({
  requireCustomerId: requireCustomerIdMock,
}));

const { default: CustomerEstimateController } = await import('#controller/customer-estimate.controller.js');
const { NotFoundError } = await import('#configs/error.js');

describe('CustomerEstimateController.getEstimateById', () => {
  beforeEach(() => requireCustomerIdMock.mockReset());

  it('sends the estimate for the authenticated customer and requested id', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const data = { id: 'e1' };
    const controller = Object.create(CustomerEstimateController.prototype);
    controller.customerEstimateService = { getEstimateById: jest.fn().mockResolvedValue(data) };
    const reply = { send: jest.fn() };
    const request = { params: { id: 'e1' } };

    await controller.getEstimateById(request, reply);

    expect(controller.customerEstimateService.getEstimateById).toHaveBeenCalledWith('e1', 'c1');
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Estimate retrieved', data });
  });

  it('propagates NotFoundError when the estimate belongs to another customer', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const controller = Object.create(CustomerEstimateController.prototype);
    controller.customerEstimateService = {
      getEstimateById: jest.fn().mockRejectedValue(new NotFoundError('Estimate not found')),
    };
    const request = { params: { id: 'other-customers-estimate' } };

    await expect(controller.getEstimateById(request, { send: jest.fn() })).rejects.toThrow(NotFoundError);
  });
});
