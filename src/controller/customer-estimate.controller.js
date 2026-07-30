import { requireCustomerId } from '#common/require-customer-id.js';

class CustomerEstimateController {
  constructor({ customerEstimateService }) {
    this.customerEstimateService = customerEstimateService;
  }

  async listEstimates(request, reply) {
    const customerId = requireCustomerId();
    const { page, pageSize } = request.query;
    const { estimates, pagination } = await this.customerEstimateService.listEstimates(customerId, {
      page,
      pageSize,
    });
    reply.send({ success: true, message: 'Estimates retrieved', data: estimates, pagination });
  }

  async getEstimateById(request, reply) {
    const customerId = requireCustomerId();
    const data = await this.customerEstimateService.getEstimateById(request.params.id, customerId);
    reply.send({ success: true, message: 'Estimate retrieved', data });
  }
}

export default CustomerEstimateController;
