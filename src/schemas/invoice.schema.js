const INVOICE_STATUSES = ['draft', 'open', 'paid', 'overdue', 'void'];

const invoiceDataSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    customerId: { type: 'string' },
    invoiceNumber: { type: 'string' },
    amount: { type: 'number' },
    balanceDue: { type: 'number' },
    status: { type: 'string', enum: INVOICE_STATUSES },
    issueDate: { type: 'string' },
    dueDate: { type: 'string' },
    currency: { type: 'string' },
  },
};

export const listInvoicesSchema = {
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1, default: 1 },
      pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      status: { type: 'string', enum: INVOICE_STATUSES },
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
        data: invoiceDataSchema,
      },
    },
  },
};
