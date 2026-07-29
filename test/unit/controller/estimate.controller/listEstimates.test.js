import { jest } from '@jest/globals';

const getMock = jest.fn();

jest.unstable_mockModule('#common/request-context.js', () => ({
  requestContext: { get: getMock },
}));

const { default: EstimateController } = await import('#controller/estimate.controller.js');

describe('EstimateController.listEstimates', () => {
  beforeEach(() => getMock.mockReset());

  it('sends the estimates and pagination for the identity customerId', async () => {
    getMock.mockReturnValue({ customerId: 'c1' });
    const estimates = [{ id: 'e1' }];
    const pagination = { page: 1, pageSize: 20, total: 1, totalPages: 1 };
    const controller = Object.create(EstimateController.prototype);
    controller.estimateService = { listEstimates: jest.fn().mockResolvedValue({ estimates, pagination }) };
    const reply = { send: jest.fn() };
    const request = { query: { page: 1, pageSize: 20, status: 'draft' } };

    await controller.listEstimates(request, reply);

    expect(controller.estimateService.listEstimates).toHaveBeenCalledWith('c1', {
      page: 1,
      pageSize: 20,
      status: 'draft',
    });
    expect(reply.send).toHaveBeenCalledWith({
      success: true,
      message: 'Estimates retrieved',
      data: estimates,
      pagination,
    });
  });

  it('passes undefined customerId when there is no identity', async () => {
    getMock.mockReturnValue(undefined);
    const controller = Object.create(EstimateController.prototype);
    controller.estimateService = { listEstimates: jest.fn().mockResolvedValue({ estimates: [], pagination: {} }) };
    const reply = { send: jest.fn() };
    const request = { query: {} };

    await controller.listEstimates(request, reply);

    expect(controller.estimateService.listEstimates).toHaveBeenCalledWith(undefined, {
      page: undefined,
      pageSize: undefined,
      status: undefined,
    });
  });
});
