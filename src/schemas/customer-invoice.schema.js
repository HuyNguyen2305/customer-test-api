const invoiceItemDataSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    itemId: { type: 'string' },
    description: { type: ['string', 'null'] },
    cost: { type: 'number' },
    qty: { type: 'integer' },
    sortOrder: { type: 'integer' },
  },
};

const invoiceTaxDataSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    code: { type: ['string', 'null'] },
    rate: { type: 'number' },
    type: { type: ['string', 'null'] },
    amount: { type: 'number' },
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
    status: { type: 'string', enum: ['draft', 'sent', 'void', 'write_off', 'paid'] },
    statusLabel: { type: ['string', 'null'] },
    balanceDue: { type: 'number' },
    addressId: { type: ['string', 'null'] },
    addressLabel: { type: ['string', 'null'] },
    addressLine1: { type: ['string', 'null'] },
    addressLine2: { type: ['string', 'null'] },
    addressCity: { type: ['string', 'null'] },
    addressState: { type: ['string', 'null'] },
    addressZip: { type: ['string', 'null'] },
    addressCountry: { type: ['string', 'null'] },
    subtotal: { type: 'number' },
    discountAmount: { type: 'number' },
    taxableAmount: { type: 'number' },
    taxes: { type: 'array', items: invoiceTaxDataSchema },
    taxTotal: { type: 'number' },
    total: { type: 'number' },
  },
};

export const invoiceDetailDataSchema = {
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
      addressId: { type: 'string' },
      status: { type: 'string', enum: ['draft', 'sent', 'void', 'write_off', 'paid'] },
      statusOrder: { type: 'string', enum: ['asc', 'desc'] },
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
