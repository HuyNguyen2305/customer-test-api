export default (sequelize, DataTypes) => {
  sequelize.define(
    'NoteTemplate',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      category: {
        type: DataTypes.ENUM(
          'customer_notes',
          'estimate_notes',
          'invoice_notes',
          'job_notes',
          'top_notes',
          'work_order_notes',
          'payment_terms',
        ),
        allowNull: false,
      },
      isDefault: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: 'note_templates',
    },
  );
};
