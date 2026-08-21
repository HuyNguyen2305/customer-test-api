'use strict';

// Merges customer_estimate_items and customer_invoice_items into one
// customer_line_items table (parentId + parentType discriminator, no FK on
// parentId) - approved exception to one-model-per-table, see root CLAUDE.md.
// Both source tables already share an identical column shape (see the
// 20260819*-merge-*-tax-slots migrations); the only asymmetry is the cost
// CHECK constraint, which existed on customer_invoice_items only and is
// carried over here for both.
module.exports = {
  async up({ context: queryInterface }) {
    const { DataTypes, Op } = require('sequelize');

    await queryInterface.createTable('customer_line_items', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      parentId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      parentType: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      itemId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'items',
          key: 'id',
        },
        onDelete: 'RESTRICT',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      cost: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      qty: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      taxSlots: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addConstraint('customer_line_items', {
      fields: ['cost'],
      type: 'check',
      where: { cost: { [Op.gte]: 0 } },
      name: 'customer_line_items_cost_non_negative',
    });

    await queryInterface.addConstraint('customer_line_items', {
      fields: ['parentType'],
      type: 'check',
      where: { parentType: { [Op.in]: ['estimate', 'invoice'] } },
      name: 'customer_line_items_parent_type_valid',
    });

    await queryInterface.addIndex('customer_line_items', ['parentType', 'parentId'], {
      name: 'customer_line_items_parent_type_parent_id_idx',
    });

    await queryInterface.sequelize.query(`
      INSERT INTO "customer_line_items"
        (id, "parentId", "parentType", "itemId", description, cost, qty, "sortOrder", subtotal, "taxSlots", total, "createdAt", "updatedAt")
      SELECT id, "customerEstimateId", 'estimate', "itemId", description, cost, qty, "sortOrder", subtotal, "taxSlots", total, "createdAt", "updatedAt"
      FROM "customer_estimate_items"
    `);

    await queryInterface.sequelize.query(`
      INSERT INTO "customer_line_items"
        (id, "parentId", "parentType", "itemId", description, cost, qty, "sortOrder", subtotal, "taxSlots", total, "createdAt", "updatedAt")
      SELECT id, "customerInvoiceId", 'invoice', "itemId", description, cost, qty, "sortOrder", subtotal, "taxSlots", total, "createdAt", "updatedAt"
      FROM "customer_invoice_items"
    `);

    await queryInterface.dropTable('customer_estimate_items');
    await queryInterface.dropTable('customer_invoice_items');
  },

  async down({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    await queryInterface.createTable('customer_estimate_items', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      customerEstimateId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'customer_estimates',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      itemId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'items',
          key: 'id',
        },
        onDelete: 'RESTRICT',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      cost: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      qty: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      taxSlots: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    await queryInterface.createTable('customer_invoice_items', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      customerInvoiceId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'customer_invoices',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      itemId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'items',
          key: 'id',
        },
        onDelete: 'RESTRICT',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      cost: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      qty: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      subtotal: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      taxSlots: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      total: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    });

    await queryInterface.sequelize.query(`
      INSERT INTO "customer_estimate_items"
        (id, "customerEstimateId", "itemId", description, cost, qty, "sortOrder", subtotal, "taxSlots", total, "createdAt", "updatedAt")
      SELECT id, "parentId", "itemId", description, cost, qty, "sortOrder", subtotal, "taxSlots", total, "createdAt", "updatedAt"
      FROM "customer_line_items"
      WHERE "parentType" = 'estimate'
    `);

    await queryInterface.sequelize.query(`
      INSERT INTO "customer_invoice_items"
        (id, "customerInvoiceId", "itemId", description, cost, qty, "sortOrder", subtotal, "taxSlots", total, "createdAt", "updatedAt")
      SELECT id, "parentId", "itemId", description, cost, qty, "sortOrder", subtotal, "taxSlots", total, "createdAt", "updatedAt"
      FROM "customer_line_items"
      WHERE "parentType" = 'invoice'
    `);

    await queryInterface.addIndex('customer_estimate_items', ['customerEstimateId'], {
      name: 'customer_estimate_items_customer_estimate_id_idx',
    });
    await queryInterface.addIndex('customer_invoice_items', ['customerInvoiceId'], {
      name: 'customer_invoice_items_customer_invoice_id_idx',
    });

    await queryInterface.dropTable('customer_line_items');
  },
};
