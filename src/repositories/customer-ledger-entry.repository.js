import { Op, fn, literal } from 'sequelize';

import { BaseRepository } from '#common/base-repository.js';

class CustomerLedgerEntryRepository extends BaseRepository {
  constructor({ customerLedgerEntryModel }) {
    super(customerLedgerEntryModel);
  }

  createEntry(data, options) {
    return this.create(data, options);
  }

  async getBalanceByCustomer(customerId, options = {}) {
    const result = await this.setSchema().findOne({
      attributes: [
        [
          fn(
            'SUM',
            literal(
              `CASE WHEN "type" IN ('charge', 'adjustment') THEN "amount" WHEN "type" IN ('payment', 'refund') THEN -"amount" ELSE 0 END`,
            ),
          ),
          'balance',
        ],
      ],
      where: { customerId, type: { [Op.in]: ['charge', 'payment', 'adjustment', 'refund'] } },
      raw: true,
      transaction: options.transaction,
    });
    return Number(result?.balance) || 0;
  }

  listByCustomerId(customerId, { limit, offset } = {}) {
    return this.findAndCountAll({
      where: { customerId },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      attributes: { exclude: ['customerId'] },
    });
  }
}

export default CustomerLedgerEntryRepository;
