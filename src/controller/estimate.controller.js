import { requestContext } from '#common/request-context.js';

class EstimateController {
  constructor({ estimateService }) {
    this.estimateService = estimateService;
  }

  async listEstimates(request, reply) {
    const { customerId } = requestContext.get('identity') ?? {};
    const { page, pageSize, status } = request.query;
    const { estimates, pagination } = await this.estimateService.listEstimates(customerId, {
      page,
      pageSize,
      status,
    });
    reply.send({ success: true, message: 'Estimates retrieved', data: estimates, pagination });
  }

  async getEstimateById(request, reply) {
    const { customerId } = requestContext.get('identity') ?? {};
    const data = await this.estimateService.getEstimateById(request.params.id, customerId);
    reply.send({ success: true, message: 'Estimate retrieved', data });
  }

  async createEstimate(request, reply) {
    const { customerId } = requestContext.get('identity') ?? {};
    const data = await this.estimateService.createEstimate(customerId, request.body);
    reply.send({ success: true, message: 'Estimate created', data });
  }
}

export default EstimateController;
