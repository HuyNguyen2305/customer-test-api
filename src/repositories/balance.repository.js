import { BaseRepository } from '#common/base-repository.js';

class BalanceRepository extends BaseRepository {
  constructor({ balanceModel }) {
    super(balanceModel);
  }

  getBalance(customerId) {
    return this.findOne({ where: { customerId } });
  }

  payOff(customerId) {
    return this.update({ amount: 0 }, { where: { customerId } });
  }
}

export default BalanceRepository;
