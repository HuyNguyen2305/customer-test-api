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

  async setDefaultAddress(request, reply) {
    const customerId = requireCustomerId();
    const data = await this.customerService.setDefaultAddress(customerId, request.params.id);
    reply.send({ success: true, message: 'Default address updated', data });
  }
}

export default CustomerController;
