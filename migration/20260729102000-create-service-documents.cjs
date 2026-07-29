'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');
    await queryInterface.createTable('service_documents', {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      serviceId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'services',
          key: 'id',
        },
        onDelete: 'CASCADE',
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
    await queryInterface.dropTable('service_documents');
  },
};
