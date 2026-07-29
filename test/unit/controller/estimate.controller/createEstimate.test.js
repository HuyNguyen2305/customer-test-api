import { jest } from '@jest/globals';

const getMock = jest.fn();

jest.unstable_mockModule('#common/request-context.js', () => ({
  requestContext: { get: getMock },
}));

const { default: EstimateController } = await import('#controller/estimate.controller.js');

describe('EstimateController.createEstimate', () => {
  beforeEach(() => getMock.mockReset());

  it('creates the estimate using the identity customerId and body', async () => {
    getMock.mockReturnValue({ customerId: 'c1' });
    const data = { id: 'e1', customerId: 'c1', amount: 500 };
    const controller = Object.create(EstimateController.prototype);
    controller.estimateService = { createEstimate: jest.fn().mockResolvedValue(data) };
    const reply = { send: jest.fn() };
    const body = { amount: 500, description: 'Kitchen remodel' };
    const request = { body };

    await controller.createEstimate(request, reply);

    expect(controller.estimateService.createEstimate).toHaveBeenCalledWith('c1', body);
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Estimate created', data });
  });
});
