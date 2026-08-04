const workOrderAddressDataSchema = {
  type: ['object', 'null'],
  properties: {
    id: { type: 'string' },
    label: { type: 'string' },
    line1: { type: 'string' },
    line2: { type: ['string', 'null'] },
    city: { type: ['string', 'null'] },
    state: { type: ['string', 'null'] },
    zip: { type: ['string', 'null'] },
    country: { type: ['string', 'null'] },
  },
};

const workOrderDataSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    workOrderNumber: { type: 'integer' },
    serviceName: { type: ['string', 'null'] },
    address: workOrderAddressDataSchema,
    startTime: { type: 'string' },
    endTime: { type: 'string' },
    status: { type: 'string', enum: ['pending', 'confirmed', 'completed', 'cancelled'] },
  },
};

export const listWorkOrdersSchema = {
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1, default: 1 },
      pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      addressId: { type: 'string' },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: { type: 'array', items: workOrderDataSchema },
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

export const getWorkOrderByIdSchema = {
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
        data: workOrderDataSchema,
      },
    },
  },
};
