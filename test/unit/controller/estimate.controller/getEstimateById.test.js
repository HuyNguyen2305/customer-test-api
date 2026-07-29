import { jest } from '@jest/globals';

const getMock = jest.fn();

jest.unstable_mockModule('#common/request-context.js', () => ({
  requestContext: { get: getMock },
}));

const { default: EstimateController } = await import('#controller/estimate.controller.js');

describe('EstimateController.getEstimateById', () => {
  beforeEach(() => getMock.mockReset());

  it('sends the estimate for the identity customerId and params id', async () => {
    getMock.mockReturnValue({ customerId: 'c1' });
    const data = { id: 'e1', amount: 10 };
    const controller = Object.create(EstimateController.prototype);
    controller.estimateService = { getEstimateById: jest.fn().mockResolvedValue(data) };
    const reply = { send: jest.fn() };
    const request = { params: { id: 'e1' } };

    await controller.getEstimateById(request, reply);

    expect(controller.estimateService.getEstimateById).toHaveBeenCalledWith('e1', 'c1');
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Estimate retrieved', data });
  });

  it('passes undefined customerId when there is no identity', async () => {
    getMock.mockReturnValue(undefined);
    const controller = Object.create(EstimateController.prototype);
    controller.estimateService = { getEstimateById: jest.fn().mockResolvedValue({}) };
    const reply = { send: jest.fn() };
    const request = { params: { id: 'e1' } };

    await controller.getEstimateById(request, reply);

    expect(controller.estimateService.getEstimateById).toHaveBeenCalledWith('e1', undefined);
  });
});
