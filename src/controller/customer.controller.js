import { requireCustomerId } from '#common/require-customer-id.js';

class CustomerController {
  constructor({ customerService }) {
    this.customerService = customerService;
  }

  async getProfile(request, reply) {
    const customerId = requireCustomerId();
    const data = await this.customerService.getProfile(customerId);
    reply.send({ success: true, message: 'Profile retrieved', data });
  }
}

export default CustomerController;
