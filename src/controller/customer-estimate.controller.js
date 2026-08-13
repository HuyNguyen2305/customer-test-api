import { requireCustomerId } from '#common/require-customer-id.js';

class CustomerEstimateController {
  constructor({ customerEstimateService, estimatePdfService }) {
    this.customerEstimateService = customerEstimateService;
    this.estimatePdfService = estimatePdfService;
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

  async getEstimatePdf(request, reply) {
    const customerId = requireCustomerId();
    const { buffer } = await this.estimatePdfService.getEstimatePdf(request.params.id, customerId);
    return reply
      .header('Content-Disposition', `inline; filename="estimate-${request.params.id}.pdf"`)
      .type('application/pdf')
      .send(buffer);
  }

  async createInvoice(request, reply) {
    const customerId = requireCustomerId();
    const data = await this.customerEstimateService.createInvoiceFromEstimate(request.params.id, customerId);
    reply.send({ success: true, message: 'Invoice created from estimate', data });
  }
}

export default CustomerEstimateController;
