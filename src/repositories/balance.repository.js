import { BaseRepository } from '#common/base-repository.js';

class BalanceRepository extends BaseRepository {
  constructor({ balanceModel }) {
    super(balanceModel);
  }

  getBalance(customerId) {
    return this.findOne({ where: { customerId }, attributes: ['amount', 'currency'] });
  }

  setAmount(customerId, amount, options = {}) {
    return this.update({ amount }, { where: { customerId }, transaction: options.transaction });
  }
}

export default BalanceRepository;
