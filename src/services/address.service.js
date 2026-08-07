import { NotFoundError } from '#configs/error.js';

class AddressService {
  constructor({ addressRepository }) {
    this.addressRepository = addressRepository;
  }

  listAddresses(customerId) {
    return this.addressRepository.listByCustomerId(customerId);
  }

  async getAddressById(customerId, id) {
    const address = await this.addressRepository.getByIdForCustomer(id, customerId);
    if (!address) throw new NotFoundError('Address not found');
    return address;
  }

  async createAddress(customerId, { label, line1, line2, city, state, zip, country }) {
    const existing = await this.addressRepository.listByCustomerId(customerId);
    return this.addressRepository.createAddress({
      customerId,
      label,
      line1,
      line2,
      city,
      state,
      zip,
      country,
      isDefault: existing.length === 0,
    });
  }

  async updateAddress(customerId, id, data) {
    const address = await this.addressRepository.updateAddress(id, customerId, data);
    if (!address) throw new NotFoundError('Address not found');
    return address;
  }

  async deleteAddress(customerId, id) {
    const deleted = await this.addressRepository.deleteAddress(id, customerId);
    if (!deleted) throw new NotFoundError('Address not found');
  }
}

export default AddressService;
