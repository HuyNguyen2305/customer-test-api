import { Op } from 'sequelize';
import { sequelize } from '#common/sequelize.js';
import { BaseRepository } from '#common/base-repository.js';

class CustomerRepository extends BaseRepository {
  constructor({ customerModel, addressModel }) {
    super(customerModel);
    this.addressModel = addressModel;
  }

  findById(id) {
    return this.findByPk(id);
  }

  // Only used by the profile endpoint - restricted so passwordHash and other
  // sensitive/unused columns never leave the DB layer for this call.
  findByIdWithAddresses(id) {
    return this.findByPk(id, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'mobile'],
      include: [
        {
          model: this.scopeModel(this.addressModel),
          attributes: { exclude: ['customerId', 'createdAt', 'updatedAt'] },
        },
      ],
    });
  }

  setGatewayCustomerId(id, gateway, gatewayCustomerId) {
    const column = gateway === 'square' ? 'squareCustomerId' : 'stripeCustomerId';
    return this.update({ [column]: gatewayCustomerId }, { where: { id } });
  }

  setDefaultAddress(id, customerId) {
    return sequelize.transaction(async (transaction) => {
      const scoped = this.scopeModel(this.addressModel);
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

export default CustomerRepository;
