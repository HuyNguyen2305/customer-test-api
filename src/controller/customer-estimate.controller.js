import { requireCustomerId } from '#common/require-customer-id.js';

class CustomerEstimateController {
  constructor({ customerEstimateService }) {
    this.customerEstimateService = customerEstimateService;
  }

  async listEstimates(request, reply) {
    const customerId = requireCustomerId();
    const { page, pageSize, addressId } = request.query;
    const { estimates, pagination } = await this.customerEstimateService.listEstimates(customerId, {
      page,
      pageSize,
      addressId,
    });
    reply.send({ success: true, message: 'Estimates retrieved', data: estimates, pagination });
  }

  async getEstimateById(request, reply) {
    const customerId = requireCustomerId();
    const data = await this.customerEstimateService.getEstimateById(request.params.id, customerId);
    reply.send({ success: true, message: 'Estimate retrieved', data });
  }

  async createInvoice(request, reply) {
    const customerId = requireCustomerId();
    const data = await this.customerEstimateService.createInvoiceFromEstimate(request.params.id, customerId);
    reply.send({ success: true, message: 'Invoice created from estimate', data });
  }
}

export default CustomerEstimateController;
