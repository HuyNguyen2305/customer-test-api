import { jest } from '@jest/globals';
import { seedWithTransaction, TEST_SCHEMA } from '../../helpers/seed-fixtures.js';

const { default: CustomerRepository } = await import('#repositories/customer.repository.js');
const { default: CustomerPaymentMethodRepository } = await import('#repositories/customer-payment-method.repository.js');
const models = (await import('#models/index.js')).default;

const customer = {
  id: '77777777-8888-9999-aaaa-bbbbbbbbbbbb',
  firstName: 'Carol',
  lastName: 'Carter',
  email: 'carol@example.com',
  mobile: '555-0003',
};

describe('Customer default-uniqueness DB constraints (integration)', () => {
  it('rejects a second default address for the same customer, but allows a second non-default one', async () => {
    await seedWithTransaction({ Customer: [customer] }, async () => {
      await models.Address.schema(TEST_SCHEMA).create({
        customerId: customer.id,
        label: 'Home',
        line1: '1 Main St',
        isDefault: true,
      });

      await expect(
        models.Address.schema(TEST_SCHEMA).create({
          customerId: customer.id,
          label: 'Work',
          line1: '2 Market St',
          isDefault: true,
        }),
      ).rejects.toThrow();

      await expect(
        models.Address.schema(TEST_SCHEMA).create({
          customerId: customer.id,
          label: 'Cabin',
          line1: '3 Lake Rd',
          isDefault: false,
        }),
      ).resolves.toBeDefined();
    });
  });

  it('rejects a second default payment method for the same customer, but allows a second non-default one', async () => {
    await seedWithTransaction({ Customer: [customer] }, async () => {
      const repository = Object.create(CustomerPaymentMethodRepository.prototype);
      repository.model = models.CustomerPaymentMethod;

      await repository.create({
        customerId: customer.id,
        type: 'card',
        token: 'tok_visa_1111',
        isDefault: true,
      });

      await expect(
        repository.create({
          customerId: customer.id,
          type: 'card',
          token: 'tok_visa_2222',
          isDefault: true,
        }),
      ).rejects.toThrow();

      await expect(
        repository.create({
          customerId: customer.id,
          type: 'bank',
          token: 'tok_bank_3333',
          isDefault: false,
        }),
      ).resolves.toBeDefined();
    });
  });

  it('rolls back the "unset previous default" step if setting the new address default fails mid-transaction', async () => {
    await seedWithTransaction({ Customer: [customer] }, async () => {
      const addressOld = await models.Address.schema(TEST_SCHEMA).create({
        customerId: customer.id,
        label: 'Home',
        line1: '1 Main St',
        isDefault: true,
      });
      const addressNew = await models.Address.schema(TEST_SCHEMA).create({
        customerId: customer.id,
        label: 'Work',
        line1: '2 Market St',
        isDefault: false,
      });

      const repository = Object.create(CustomerRepository.prototype);
      repository.model = models.Customer;
      repository.addressModel = models.Address;

      const originalUpdate = models.Address.update;
      let updateCallCount = 0;
      const spy = jest.spyOn(models.Address, 'update').mockImplementation(function mockedUpdate(...args) {
        updateCallCount += 1;
        // 1st update call is the "unset others" step; let it through for real.
        // 2nd update call is the "set target true" step; fail it to force a rollback.
        if (updateCallCount === 2) return Promise.reject(new Error('Simulated failure'));
        return originalUpdate.apply(this, args);
      });

      try {
        await expect(repository.setDefaultAddress(addressNew.id, customer.id)).rejects.toThrow('Simulated failure');
      } finally {
        spy.mockRestore();
      }

      const rows = await models.Address.schema(TEST_SCHEMA).findAll({ where: { customerId: customer.id } });
      const stillOldDefault = rows.find((row) => row.id === addressOld.id);
      const newOne = rows.find((row) => row.id === addressNew.id);
      expect(stillOldDefault.isDefault).toBe(true);
      expect(newOne.isDefault).toBe(false);
    });
  });

  it('rolls back the "unset previous default" step if setting the new payment method default fails mid-transaction', async () => {
    await seedWithTransaction({ Customer: [customer] }, async () => {
      const repository = Object.create(CustomerPaymentMethodRepository.prototype);
      repository.model = models.CustomerPaymentMethod;

      const pmOld = await repository.create({
        customerId: customer.id,
        type: 'card',
        token: 'tok_visa_1111',
        isDefault: true,
      });
      const pmNew = await repository.create({
        customerId: customer.id,
        type: 'bank',
        token: 'tok_bank_2222',
        isDefault: false,
      });

      const originalUpdate = models.CustomerPaymentMethod.update;
      let updateCallCount = 0;
      const spy = jest.spyOn(models.CustomerPaymentMethod, 'update').mockImplementation(function mockedUpdate(...args) {
        updateCallCount += 1;
        if (updateCallCount === 2) return Promise.reject(new Error('Simulated failure'));
        return originalUpdate.apply(this, args);
      });

      try {
        await expect(repository.setDefault(pmNew.id, customer.id)).rejects.toThrow('Simulated failure');
      } finally {
        spy.mockRestore();
      }

      const rows = await models.CustomerPaymentMethod.schema(TEST_SCHEMA).findAll({ where: { customerId: customer.id } });
      const stillOldDefault = rows.find((row) => row.id === pmOld.id);
      const newOne = rows.find((row) => row.id === pmNew.id);
      expect(stillOldDefault.isDefault).toBe(true);
      expect(newOne.isDefault).toBe(false);
    });
  });
});
