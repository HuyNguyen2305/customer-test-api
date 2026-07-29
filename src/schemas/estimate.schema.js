const ESTIMATE_STATUSES = ['draft', 'sent', 'approved', 'declined', 'expired'];

const estimateDataSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    customerId: { type: 'string' },
    status: { type: 'string', enum: ESTIMATE_STATUSES },
    amount: { type: 'number' },
    description: { type: 'string', nullable: true },
    validUntil: { type: 'string', nullable: true },
    createdAt: { type: 'string' },
    updatedAt: { type: 'string' },
  },
};

export const listEstimatesSchema = {
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1, default: 1 },
      pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
      status: { type: 'string', enum: ESTIMATE_STATUSES },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: { type: 'array', items: estimateDataSchema },
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

export const getEstimateByIdSchema = {
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
        data: estimateDataSchema,
      },
    },
  },
};

export const createEstimateSchema = {
  body: {
    type: 'object',
    required: ['amount'],
    properties: {
      amount: { type: 'number' },
      description: { type: 'string' },
      validUntil: { type: 'string' },
      status: { type: 'string', enum: ESTIMATE_STATUSES },
    },
  },
  response: {
    200: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: estimateDataSchema,
      },
    },
  },
};
