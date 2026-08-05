const paymentMethodDataSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    type: { type: 'string', enum: ['card', 'bank', 'other', 'open_credit'] },
    token: { type: ['string', 'null'] },
    gateway: { type: ['string', 'null'], enum: ['stripe', 'square', null] },
    creditBalance: { type: ['number', 'null'] },
    isDefault: { type: 'boolean' },
  },
};

export const listPaymentMethodsSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: { type: 'array', items: paymentMethodDataSchema },
      },
    },
  },
};

export const createPaymentMethodSchema = {
  body: {
    type: 'object',
    required: ['gateway', 'nonce'],
    properties: {
      gateway: { type: 'string', enum: ['square', 'stripe'] },
      nonce: { type: 'string' },
      cardholderName: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: paymentMethodDataSchema,
      },
    },
  },
};

export const setDefaultPaymentMethodSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string' } },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: paymentMethodDataSchema,
      },
    },
  },
};
