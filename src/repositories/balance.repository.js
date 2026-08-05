import { BaseRepository } from '#common/base-repository.js';

class BalanceRepository extends BaseRepository {
  constructor({ balanceModel }) {
    super(balanceModel);
  }

  getBalance(customerId) {
    return this.findOne({ where: { customerId } });
  }

  setAmount(customerId, amount) {
    return this.update({ amount }, { where: { customerId } });
  }
}

export default BalanceRepository;
