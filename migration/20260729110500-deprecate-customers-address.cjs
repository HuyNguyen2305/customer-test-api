'use strict';

// Marks customers.address as deprecated at the DB level now that its data has been
// migrated into the addresses table (see 20260729110400-migrate-customer-addresses.cjs).
// The column is intentionally NOT dropped here - removal is deferred to a later cleanup
// migration once we've confirmed nothing else reads from it directly.
module.exports = {
  async up({ context: queryInterface }) {
    await queryInterface.sequelize.query(
      `COMMENT ON COLUMN "customers"."address" IS 'DEPRECATED: superseded by the addresses table. Scheduled for removal in a future cleanup migration once confirmed unused.'`,
    );
  },

  async down({ context: queryInterface }) {
    await queryInterface.sequelize.query(`COMMENT ON COLUMN "customers"."address" IS NULL`);
  },
};
