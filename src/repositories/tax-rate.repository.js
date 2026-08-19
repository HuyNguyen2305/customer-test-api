import { BaseRepository } from '#common/base-repository.js';

class TaxRateRepository extends BaseRepository {
  constructor({ taxRateModel }) {
    super(taxRateModel);
  }

  findByState(state) {
    if (!state) return null;
    return this.findOne({ where: { state, country: 'US' } });
  }

  findByIds(ids) {
    if (!ids.length) return [];
    return this.findAll({ where: { id: ids } });
  }
}

export default TaxRateRepository;
