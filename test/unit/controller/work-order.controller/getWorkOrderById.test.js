import { jest } from '@jest/globals';

const requireCustomerIdMock = jest.fn();

jest.unstable_mockModule('#common/require-customer-id.js', () => ({
  requireCustomerId: requireCustomerIdMock,
}));

const { default: WorkOrderController } = await import('#controller/work-order.controller.js');
const { NotFoundError } = await import('#configs/error.js');

describe('WorkOrderController.getWorkOrderById', () => {
  beforeEach(() => requireCustomerIdMock.mockReset());

  it('sends the work order for the authenticated customer and requested id', async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const data = { id: 'b1', workOrderNumber: 13970 };
    const controller = Object.create(WorkOrderController.prototype);
    controller.workOrderService = { getWorkOrderById: jest.fn().mockResolvedValue(data) };
    const reply = { send: jest.fn() };
    const request = { params: { id: 'b1' } };

    await controller.getWorkOrderById(request, reply);

    expect(controller.workOrderService.getWorkOrderById).toHaveBeenCalledWith('b1', 'c1');
    expect(reply.send).toHaveBeenCalledWith({ success: true, message: 'Work order retrieved', data });
  });

  it("propagates NotFoundError when the booking belongs to another customer or isn't completed", async () => {
    requireCustomerIdMock.mockReturnValue('c1');
    const controller = Object.create(WorkOrderController.prototype);
    controller.workOrderService = {
      getWorkOrderById: jest.fn().mockRejectedValue(new NotFoundError('Work order not found')),
    };
    const request = { params: { id: 'other-customers-booking' } };

    await expect(controller.getWorkOrderById(request, { send: jest.fn() })).rejects.toThrow(NotFoundError);
  });
});
