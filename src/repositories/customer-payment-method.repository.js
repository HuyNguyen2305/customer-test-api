import { Op } from 'sequelize';
import { sequelize } from '#common/sequelize.js';
import { BaseRepository } from '#common/base-repository.js';

class CustomerPaymentMethodRepository extends BaseRepository {
  constructor({ customerPaymentMethodModel }) {
    super(customerPaymentMethodModel);
  }

  listByCustomerId(customerId) {
    return this.findAll({ where: { customerId } });
  }

  setDefault(id, customerId) {
    return sequelize.transaction(async (transaction) => {
      const scoped = this.setSchema();
      const existing = await scoped.findOne({ where: { id, customerId }, transaction });
      if (!existing) return null;

      await scoped.update(
        { isDefault: false },
        { where: { customerId, isDefault: true, id: { [Op.ne]: id } }, transaction },
      );
      await scoped.update({ isDefault: true }, { where: { id, customerId }, transaction });

      return scoped.findOne({ where: { id, customerId }, transaction });
    });
  }
}

export default CustomerPaymentMethodRepository;
