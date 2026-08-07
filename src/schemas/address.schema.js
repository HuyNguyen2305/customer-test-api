const addressDataSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    label: { type: 'string' },
    line1: { type: 'string' },
    line2: { type: ['string', 'null'] },
    city: { type: ['string', 'null'] },
    state: { type: ['string', 'null'] },
    zip: { type: ['string', 'null'] },
    country: { type: ['string', 'null'] },
    isDefault: { type: 'boolean' },
  },
};

export const listAddressesSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: { type: 'array', items: addressDataSchema },
      },
    },
  },
};

export const getAddressByIdSchema = {
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
        data: addressDataSchema,
      },
    },
  },
};

export const createAddressSchema = {
  body: {
    type: 'object',
    required: ['label', 'line1'],
    properties: {
      label: { type: 'string' },
      line1: { type: 'string' },
      line2: { type: ['string', 'null'] },
      city: { type: ['string', 'null'] },
      state: { type: ['string', 'null'] },
      zip: { type: ['string', 'null'] },
      country: { type: ['string', 'null'] },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: addressDataSchema,
      },
    },
  },
};

export const updateAddressSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string' } },
  },
  body: {
    type: 'object',
    properties: {
      label: { type: 'string' },
      line1: { type: 'string' },
      line2: { type: ['string', 'null'] },
      city: { type: ['string', 'null'] },
      state: { type: ['string', 'null'] },
      zip: { type: ['string', 'null'] },
      country: { type: ['string', 'null'] },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: addressDataSchema,
      },
    },
  },
};

export const deleteAddressSchema = {
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
        data: { type: 'null' },
      },
    },
  },
};
