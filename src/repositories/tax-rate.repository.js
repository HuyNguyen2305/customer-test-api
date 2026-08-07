import { BaseRepository } from '#common/base-repository.js';

class TaxRateRepository extends BaseRepository {
  constructor({ taxRateModel }) {
    super(taxRateModel);
  }

  findByState(state) {
    if (!state) return null;
    return this.findOne({ where: { state, country: 'US' } });
  }
}

export default TaxRateRepository;
