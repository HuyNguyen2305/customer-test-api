const lineItemDataSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    customerInvoiceId: { type: 'string' },
    itemId: { type: 'string' },
    description: { type: ['string', 'null'] },
    cost: { type: 'number' },
    qty: { type: 'integer' },
    sortOrder: { type: 'integer' },
  },
};

const invoiceIdParams = {
  type: 'object',
  required: ['invoiceId'],
  properties: { invoiceId: { type: 'string' } },
};

const invoiceAndItemIdParams = {
  type: 'object',
  required: ['invoiceId', 'itemId'],
  properties: {
    invoiceId: { type: 'string' },
    itemId: { type: 'string' },
  },
};

export const listLineItemsSchema = {
  params: invoiceIdParams,
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: { type: 'array', items: lineItemDataSchema },
      },
    },
  },
};

export const addLineItemSchema = {
  params: invoiceIdParams,
  body: {
    type: 'object',
    required: ['itemId', 'cost', 'qty'],
    properties: {
      itemId: { type: 'string' },
      description: { type: ['string', 'null'] },
      cost: { type: 'number' },
      qty: { type: 'integer', minimum: 1 },
      sortOrder: { type: 'integer' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: lineItemDataSchema,
      },
    },
  },
};

export const updateLineItemSchema = {
  params: invoiceAndItemIdParams,
  body: {
    type: 'object',
    properties: {
      description: { type: ['string', 'null'] },
      cost: { type: 'number' },
      qty: { type: 'integer', minimum: 1 },
      sortOrder: { type: 'integer' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: lineItemDataSchema,
      },
    },
  },
};

export const removeLineItemSchema = {
  params: invoiceAndItemIdParams,
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: { type: 'null' },
      },
    },
  },
};
