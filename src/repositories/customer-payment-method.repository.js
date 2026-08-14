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

  addPaymentMethod(data) {
    return this.create(data);
  }

  getPaymentMethodById(id, customerId) {
    return this.findOne({ where: { id, customerId } });
  }

  decrementCredit(id, amount, options = {}) {
    const run = async (transaction) => {
      const scoped = this.setSchema();
      const paymentMethod = await scoped.findByPk(id, { transaction });
      if (!paymentMethod) return null;

      const newBalance = Number(paymentMethod.creditBalance) - amount;
      await scoped.update({ creditBalance: newBalance }, { where: { id }, transaction });
      return scoped.findByPk(id, { transaction });
    };

    return options.transaction ? run(options.transaction) : sequelize.transaction(run);
  }

  upsertOpenCredit(customerId, amount) {
    return sequelize.transaction(async (transaction) => {
      const scoped = this.setSchema();
      const existing = await scoped.findOne({ where: { customerId, type: 'open_credit' }, transaction });

      if (existing) {
        const newBalance = Number(existing.creditBalance) + amount;
        await scoped.update({ creditBalance: newBalance }, { where: { id: existing.id }, transaction });
        return scoped.findByPk(existing.id, { transaction });
      }

      return scoped.create(
        { customerId, type: 'open_credit', creditBalance: amount, isDefault: false },
        { transaction },
      );
    });
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
