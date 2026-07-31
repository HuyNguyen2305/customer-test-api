'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.addConstraint('customer_ledger_entries', {
      fields: ['referenceId'],
      type: 'foreign key',
      name: 'customer_ledger_entries_reference_id_fkey',
      references: {
        table: 'customer_invoices',
        field: 'id',
      },
      onDelete: 'RESTRICT',
    });
  },

  async down({ context: queryInterface }) {
    await queryInterface.removeConstraint('customer_ledger_entries', 'customer_ledger_entries_reference_id_fkey');
  },
};
