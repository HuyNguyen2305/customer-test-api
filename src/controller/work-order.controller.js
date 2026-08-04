import { requireCustomerId } from '#common/require-customer-id.js';

class WorkOrderController {
  constructor({ workOrderService }) {
    this.workOrderService = workOrderService;
  }

  async listWorkOrders(request, reply) {
    const customerId = requireCustomerId();
    const { page, pageSize, addressId } = request.query;
    const { workOrders, pagination } = await this.workOrderService.listWorkOrders(customerId, {
      page,
      pageSize,
      addressId,
    });
    reply.send({ success: true, message: 'Work orders retrieved', data: workOrders, pagination });
  }

  async getWorkOrderById(request, reply) {
    const customerId = requireCustomerId();
    const data = await this.workOrderService.getWorkOrderById(request.params.id, customerId);
    reply.send({ success: true, message: 'Work order retrieved', data });
  }
}

export default WorkOrderController;
