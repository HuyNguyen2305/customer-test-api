const paymentMethodDataSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    type: { type: 'string', enum: ['card', 'bank', 'other'] },
    token: { type: 'string' },
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
