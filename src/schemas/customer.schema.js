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

const profileDataSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    firstName: { type: 'string' },
    lastName: { type: 'string' },
    email: { type: 'string' },
    mobile: { type: ['string', 'null'] },
    Addresses: { type: 'array', items: addressDataSchema },
  },
};

export const getProfileSchema = {
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: profileDataSchema,
      },
    },
  },
};

export const setDefaultAddressSchema = {
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
