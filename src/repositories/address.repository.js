import { BaseRepository } from '#common/base-repository.js';

class AddressRepository extends BaseRepository {
  constructor({ addressModel }) {
    super(addressModel);
  }

  listByCustomerId(customerId) {
    return this.findAll({
      where: { customerId },
      order: [
        ['isDefault', 'DESC'],
        ['createdAt', 'ASC'],
      ],
      attributes: { exclude: ['customerId', 'createdAt', 'updatedAt'] },
    });
  }

  getByIdForCustomer(id, customerId) {
    return this.findOne({
      where: { id, customerId },
      attributes: { exclude: ['customerId', 'createdAt', 'updatedAt'] },
    });
  }

  createAddress(data) {
    return this.create(data);
  }

  async updateAddress(id, customerId, data) {
    const scoped = this.setSchema();
    const [updated] = await scoped.update(data, { where: { id, customerId } });
    if (!updated) return null;
    return scoped.findOne({ where: { id, customerId } });
  }

  async deleteAddress(id, customerId) {
    const destroyed = await this.destroy({ where: { id, customerId } });
    return destroyed > 0;
  }
}

export default AddressRepository;
