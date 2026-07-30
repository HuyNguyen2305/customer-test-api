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
}

export default CustomerService;
