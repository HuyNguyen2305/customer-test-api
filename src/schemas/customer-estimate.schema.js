const estimateItemDataSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    itemId: { type: 'string' },
    description: { type: ['string', 'null'] },
    cost: { type: 'number' },
    taxRateId: { type: ['string', 'null'] },
    qty: { type: 'integer' },
    sortOrder: { type: 'integer' },
  },
};

const estimateDataSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    bookingId: { type: 'string' },
    customerId: { type: 'string' },
    sourceEstimateId: { type: ['string', 'null'] },
    type: { type: 'string', enum: ['basic', 'dynamic', 'package'] },
    discountValue: { type: 'number' },
    discountType: { type: 'string', enum: ['percent', 'flat'] },
    depositValue: { type: 'number' },
    depositType: { type: 'string', enum: ['percent', 'flat'] },
    termsText: { type: ['string', 'null'] },
    notesText: { type: ['string', 'null'] },
    status: { type: 'string', enum: ['draft', 'sent', 'approved', 'declined', 'expired'] },
  },
};

const estimateDetailDataSchema = {
  type: 'object',
  properties: {
    ...estimateDataSchema.properties,
    CustomerEstimateItems: { type: 'array', items: estimateItemDataSchema },
  },
};

export const listEstimatesSchema = {
  querystring: {
    type: 'object',
    properties: {
      page: { type: 'integer', minimum: 1, default: 1 },
      pageSize: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
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
        data: estimateDetailDataSchema,
      },
    },
  },
};
