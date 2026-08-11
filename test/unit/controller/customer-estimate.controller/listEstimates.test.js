import { jest } from '@jest/globals';

const requireCustomerIdMock = jest.fn();

jest.unstable_mockModule('#common/require-customer-id.js', () => ({
  requireCustomerId: requireCustomerIdMock,
}));

const { default: CustomerEstimateController } = await import('#controller/customer-estimate.controller.js');

describe('CustomerEstimateController.listEstimates', () => {
  beforeEach(() => requireCustomerIdMock.mockReset());

  it('sends estimates and pagination for the authenticated customer', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const estimates = [{ id: 'e1' }];
    const pagination = { page: 1, pageSize: 20, total: 1, totalPages: 1 };
    const controller = Object.create(CustomerEstimateController.prototype);
    controller.customerEstimateService = { listEstimates: jest.fn().mockResolvedValue({ estimates, pagination }) };
    const reply = { send: jest.fn() };
    const request = { query: {} };

    await controller.listEstimates(request, reply);

    expect(reply.send).toHaveBeenCalledWith({
      success: true,
      message: 'Estimates retrieved',
      data: estimates,
      pagination,
    });
  });

  it('forwards addressId from the query string to the service', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const controller = Object.create(CustomerEstimateController.prototype);
    controller.customerEstimateService = {
      listEstimates: jest.fn().mockResolvedValue({ estimates: [], pagination: {} }),
    };
    const request = { query: { page: 2, pageSize: 10, addressId: 'addr1' } };

    await controller.listEstimates(request, { send: jest.fn() });

    expect(controller.customerEstimateService.listEstimates).toHaveBeenCalledWith('c1', {
      page: 2,
      pageSize: 10,
      addressId: 'addr1',
    });
  });
});
