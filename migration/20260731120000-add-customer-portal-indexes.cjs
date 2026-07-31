'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.addIndex('customer_invoices', ['customerId', 'createdAt'], {
      name: 'customer_invoices_customer_id_created_at_idx',
    });
    await queryInterface.addIndex('customer_invoice_items', ['customerInvoiceId'], {
      name: 'customer_invoice_items_customer_invoice_id_idx',
    });
    await queryInterface.addIndex('customer_estimates', ['customerId', 'createdAt'], {
      name: 'customer_estimates_customer_id_created_at_idx',
    });
    await queryInterface.addIndex('customer_estimate_items', ['customerEstimateId'], {
      name: 'customer_estimate_items_customer_estimate_id_idx',
    });
    await queryInterface.addIndex('customer_ledger_entries', ['customerId', 'createdAt'], {
      name: 'customer_ledger_entries_customer_id_created_at_idx',
    });
    await queryInterface.addIndex('customer_documents', ['customerId', 'createdAt'], {
      name: 'customer_documents_customer_id_created_at_idx',
    });
    await queryInterface.addIndex('customer_payment_methods', ['customerId'], {
      name: 'customer_payment_methods_customer_id_idx',
    });
  },

  async down({ context: queryInterface }) {
    await queryInterface.removeIndex('customer_invoices', 'customer_invoices_customer_id_created_at_idx');
    await queryInterface.removeIndex('customer_invoice_items', 'customer_invoice_items_customer_invoice_id_idx');
    await queryInterface.removeIndex('customer_estimates', 'customer_estimates_customer_id_created_at_idx');
    await queryInterface.removeIndex('customer_estimate_items', 'customer_estimate_items_customer_estimate_id_idx');
    await queryInterface.removeIndex('customer_ledger_entries', 'customer_ledger_entries_customer_id_created_at_idx');
    await queryInterface.removeIndex('customer_documents', 'customer_documents_customer_id_created_at_idx');
    await queryInterface.removeIndex('customer_payment_methods', 'customer_payment_methods_customer_id_idx');
  },
};
