import { BaseRepository } from '#common/base-repository.js';

class CustomerRepository extends BaseRepository {
  constructor({ customerModel, addressModel }) {
    super(customerModel);
    this.addressModel = addressModel;
  }

  findById(id) {
    return this.findByPk(id);
  }

  findByIdWithAddresses(id) {
    return this.findByPk(id, { include: [{ model: this.scopeModel(this.addressModel) }] });
  }
}

export default CustomerRepository;
