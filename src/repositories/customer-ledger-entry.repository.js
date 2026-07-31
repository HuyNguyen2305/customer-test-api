import { Op, fn, literal } from 'sequelize';

import { BaseRepository } from '#common/base-repository.js';

class CustomerLedgerEntryRepository extends BaseRepository {
  constructor({ customerLedgerEntryModel }) {
    super(customerLedgerEntryModel);
  }

  createEntry(data) {
    return this.create(data);
  }

  async getBalanceByCustomer(customerId) {
    const result = await this.setSchema().findOne({
      attributes: [
        [
          fn('SUM', literal(`CASE WHEN "type" = 'charge' THEN "amount" WHEN "type" = 'payment' THEN -"amount" ELSE 0 END`)),
          'balance',
        ],
      ],
      where: { customerId, type: { [Op.in]: ['charge', 'payment'] } },
      raw: true,
    });
    return Number(result?.balance) || 0;
  }

  listByCustomerId(customerId, { limit, offset } = {}) {
    return this.findAndCountAll({ where: { customerId }, limit, offset, order: [['createdAt', 'DESC']] });
  }
}

export default CustomerLedgerEntryRepository;
