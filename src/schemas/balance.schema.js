const balanceDataSchema = {
  type: 'object',
  properties: {
    amount: { type: 'number' },
    currency: { type: 'string' },
  },
};

export const getBalanceSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: balanceDataSchema,
      },
    },
  },
};

export const payBalanceSchema = {
  body: {
    type: 'object',
    required: ['paymentMethodId'],
    properties: {
      paymentMethodId: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: balanceDataSchema,
      },
    },
  },
};
