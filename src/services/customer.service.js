import { NotFoundError } from '#configs/error.js';

class CustomerService {
  constructor({ customerRepository }) {
    this.customerRepository = customerRepository;
  }

  async getProfile(customerId) {
    const customer = await this.customerRepository.findByIdWithAddresses(customerId);
    if (!customer) throw new NotFoundError('Customer not found');
    return customer;
  }

  async setDefaultAddress(customerId, addressId) {
    const address = await this.customerRepository.setDefaultAddress(addressId, customerId);
    if (!address) throw new NotFoundError('Address not found');
    return address;
  }
}

export default CustomerService;
