import { requestContext } from '#common/request-context.js';

class BalanceController {
  constructor({ balanceService }) {
    this.balanceService = balanceService;
  }

  async getBalance(request, reply) {
    const { customerId } = requestContext.get('identity') ?? {};
    const data = await this.balanceService.getBalance(customerId);
    reply.send({ success: true, message: 'Balance retrieved', data });
  }

  async payBalance(request, reply) {
    const { customerId } = requestContext.get('identity') ?? {};
    const { paymentMethodId } = request.body;
    const data = await this.balanceService.payBalance(customerId, paymentMethodId);
    reply.send({ success: true, message: 'Balance paid', data });
  }
}

export default BalanceController;
