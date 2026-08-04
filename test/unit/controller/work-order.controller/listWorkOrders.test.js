import { jest } from '@jest/globals';

const requireCustomerIdMock = jest.fn();

jest.unstable_mockModule('#common/require-customer-id.js', () => ({
  requireCustomerId: requireCustomerIdMock,
}));

const { default: WorkOrderController } = await import('#controller/work-order.controller.js');

describe('WorkOrderController.listWorkOrders', () => {
  beforeEach(() => requireCustomerIdMock.mockReset());

  it('sends work orders and pagination for the authenticated customer', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const workOrders = [{ id: 'b1', workOrderNumber: 13970 }];
    const pagination = { page: 1, pageSize: 20, total: 1, totalPages: 1 };
    const controller = Object.create(WorkOrderController.prototype);
    controller.workOrderService = { listWorkOrders: jest.fn().mockResolvedValue({ workOrders, pagination }) };
    const reply = { send: jest.fn() };
    const request = { query: { page: 1, pageSize: 20, addressId: 'a1' } };

    await controller.listWorkOrders(request, reply);

    expect(controller.workOrderService.listWorkOrders).toHaveBeenCalledWith('c1', {
      page: 1,
      pageSize: 20,
      addressId: 'a1',
    });
    expect(reply.send).toHaveBeenCalledWith({
      success: true,
      message: 'Work orders retrieved',
      data: workOrders,
      pagination,
    });
  });
});
