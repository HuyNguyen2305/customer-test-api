const invoiceItemDataSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    itemId: { type: 'string' },
    description: { type: ['string', 'null'] },
    cost: { type: 'number' },
    taxRateId: { type: ['string', 'null'] },
    qty: { type: 'integer' },
    sortOrder: { type: 'integer' },
  },
};

const invoiceDataSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    bookingId: { type: 'string' },
    customerId: { type: 'string' },
    sourceInvoiceId: { type: ['string', 'null'] },
    discountValue: { type: 'number' },
    discountType: { type: 'string', enum: ['percent', 'flat'] },
    termsText: { type: ['string', 'null'] },
    notesText: { type: ['string', 'null'] },
    status: { type: 'string', enum: ['draft', 'sent', 'paid', 'overdue'] },
    balanceDue: { type: 'number' },
  },
};

const invoiceDetailDataSchema = {
  type: 'object',
  properties: {
    ...invoiceDataSchema.properties,
    items: { type: 'array', items: invoiceItemDataSchema },
  },
};

export const listInvoicesSchema = {
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1, default: 1 },
      pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: { type: 'array', items: invoiceDataSchema },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer' },
            pageSize: { type: 'integer' },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
      },
    },
  },
};

export const getInvoiceByIdSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: invoiceDetailDataSchema,
      },
    },
  },
};
