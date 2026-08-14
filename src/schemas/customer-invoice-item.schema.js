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
    // cost is intentionally not accepted here - it's always derived
    // server-side from the referenced Item's own price.
    required: ['itemId', 'qty'],
    properties: {
      itemId: { type: 'string' },
      description: { type: ['string', 'null'] },
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
    // cost is intentionally not accepted here either - customers can never
    // change a line item's price after the fact.
    properties: {
      description: { type: ['string', 'null'] },
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
