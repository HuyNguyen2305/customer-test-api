import { requireCustomerId } from '#common/require-customer-id.js';

class AddressController {
  constructor({ addressService }) {
    this.addressService = addressService;
  }

  async listAddresses(request, reply) {
    const customerId = requireCustomerId();
    const data = await this.addressService.listAddresses(customerId);
    reply.send({ success: true, message: 'Addresses retrieved', data });
  }

  async getAddressById(request, reply) {
    const customerId = requireCustomerId();
    const data = await this.addressService.getAddressById(customerId, request.params.id);
    reply.send({ success: true, message: 'Address retrieved', data });
  }

  async createAddress(request, reply) {
    const customerId = requireCustomerId();
    const { label, line1, line2, city, state, zip, country } = request.body;
    const data = await this.addressService.createAddress(customerId, {
      label,
      line1,
      line2,
      city,
      state,
      zip,
      country,
    });
    reply.send({ success: true, message: 'Address created', data });
  }

  async updateAddress(request, reply) {
    const customerId = requireCustomerId();
    const data = await this.addressService.updateAddress(customerId, request.params.id, request.body);
    reply.send({ success: true, message: 'Address updated', data });
  }

  async deleteAddress(request, reply) {
    const customerId = requireCustomerId();
    await this.addressService.deleteAddress(customerId, request.params.id);
    reply.send({ success: true, message: 'Address deleted', data: null });
  }
}

export default AddressController;
