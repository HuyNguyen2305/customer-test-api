'use strict';

module.exports = {
  async up({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    // CustomerDocument now doubles as both a per-customer document instance
    // (customerId set) and a per-service template row (serviceId set) -
    // exactly one is non-null per row, enforced below via a CHECK constraint.
    // Same shape as the materials/job_materials and todo_lists merges.
    await queryInterface.changeColumn('customer_documents', 'customerId', {
      type: DataTypes.UUID,
      allowNull: true,
    });
    await queryInterface.addColumn('customer_documents', 'serviceId', {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'services', key: 'id' },
      onDelete: 'CASCADE',
    });

    // Preserve original ids - no id-remap needed for downstream FKs. type is
    // cast via text since enum_customer_documents_type and
    // enum_service_documents_type are distinct Postgres types despite having
    // identical values - Postgres won't implicitly cast between them.
    await queryInterface.sequelize.query(`
      INSERT INTO "customer_documents" (id, "serviceId", "documentId", "pdfId", type, "createdAt", "updatedAt")
      SELECT id, "serviceId", "documentId", "pdfId", type::text::"enum_customer_documents_type", "createdAt", "updatedAt" FROM "service_documents"
    `);

    // Added after backfill so it validates against fully-populated data in
    // one pass, rather than against partially-migrated rows mid-migration.
    await queryInterface.sequelize.query(`
      ALTER TABLE "customer_documents" ADD CONSTRAINT "customer_documents_owner_check"
      CHECK ((("customerId" IS NOT NULL)::int + ("serviceId" IS NOT NULL)::int) = 1)
    `);

    await queryInterface.dropTable('service_documents');
  },

  async down({ context: queryInterface }) {
    const { DataTypes } = require('sequelize');

    await queryInterface.sequelize.query(
      `ALTER TABLE "customer_documents" DROP CONSTRAINT "customer_documents_owner_check"`,
    );

    await queryInterface.createTable('service_documents', {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      serviceId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'services', key: 'id' },
        onDelete: 'CASCADE',
      },
      documentId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'service_document_library', key: 'id' },
        onDelete: 'RESTRICT',
      },
      pdfId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'pdfs', key: 'id' },
        onDelete: 'RESTRICT',
      },
      type: { type: DataTypes.ENUM('doc', 'pdf'), allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false },
    });

    await queryInterface.sequelize.query(`
      INSERT INTO "service_documents" (id, "serviceId", "documentId", "pdfId", type, "createdAt", "updatedAt")
      SELECT id, "serviceId", "documentId", "pdfId", type::text::"enum_service_documents_type", "createdAt", "updatedAt" FROM "customer_documents" WHERE "serviceId" IS NOT NULL
    `);

    await queryInterface.sequelize.query(`DELETE FROM "customer_documents" WHERE "serviceId" IS NOT NULL`);

    await queryInterface.removeColumn('customer_documents', 'serviceId');
    await queryInterface.changeColumn('customer_documents', 'customerId', {
      type: DataTypes.UUID,
      allowNull: false,
    });
  },
};
