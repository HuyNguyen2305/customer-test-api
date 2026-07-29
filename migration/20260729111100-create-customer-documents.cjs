'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');
    await queryInterface.createTable('customer_documents', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      customerId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'customers',
          key: 'id',
        },
        onDelete: 'RESTRICT',
      },
      bookingId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'bookings',
          key: 'id',
        },
        onDelete: 'RESTRICT',
      },
      documentId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'service_document_library',
          key: 'id',
        },
        onDelete: 'RESTRICT',
      },
      pdfId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'pdfs',
          key: 'id',
        },
        onDelete: 'RESTRICT',
      },
      type: {
        type: DataTypes.ENUM('doc', 'pdf'),
        allowNull: false,
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
  },

  async down({ context: queryInterface }) {
    await queryInterface.dropTable('customer_documents');
  },
};
