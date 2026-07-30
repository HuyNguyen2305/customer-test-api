import { BaseRepository } from '#common/base-repository.js';

class CustomerLedgerEntryRepository extends BaseRepository {
  constructor({ customerLedgerEntryModel }) {
    super(customerLedgerEntryModel);
  }

  createEntry(data) {
    return this.create(data);
  }

  async sumByCustomerAndType(customerId, type) {
    const total = await this.setSchema().sum('amount', { where: { customerId, type } });
    return total || 0;
  }

  listByCustomerId(customerId, { limit, offset } = {}) {
    return this.findAndCountAll({ where: { customerId }, limit, offset, order: [['createdAt', 'DESC']] });
  }
}

export default CustomerLedgerEntryRepository;
