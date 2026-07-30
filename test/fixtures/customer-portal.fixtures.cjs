const customerA = {
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  firstName: 'Alice',
  lastName: 'Anderson',
  email: 'alice@example.com',
  mobile: '555-0001',
};

const customerB = {
  id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  firstName: 'Bob',
  lastName: 'Brown',
  email: 'bob@example.com',
  mobile: '555-0002',
};

const addressA = {
  id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  customerId: customerA.id,
  label: 'Home',
  line1: '1 Main St',
  isDefault: true,
};

const service1 = {
  id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
  name: 'Pest Control',
};

const item1 = {
  id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
  name: 'Treatment',
  defaultCost: 100,
};

const bookingA = {
  id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
  serviceId: service1.id,
  customerId: customerA.id,
  startTime: new Date('2026-01-01T10:00:00Z'),
  endTime: new Date('2026-01-01T11:00:00Z'),
  status: 'completed',
};

const bookingB = {
  id: '11111111-2222-3333-4444-555555555555',
  serviceId: service1.id,
  customerId: customerB.id,
  startTime: new Date('2026-01-02T10:00:00Z'),
  endTime: new Date('2026-01-02T11:00:00Z'),
  status: 'completed',
};

const invoiceA = {
  id: '11111111-2222-3333-4444-666666666666',
  bookingId: bookingA.id,
  customerId: customerA.id,
  status: 'sent',
  balanceDue: 100,
};

const invoiceB = {
  id: '11111111-2222-3333-4444-777777777777',
  bookingId: bookingB.id,
  customerId: customerB.id,
  status: 'sent',
  balanceDue: 50,
};

const invoiceItemA = {
  id: '11111111-2222-3333-4444-888888888888',
  customerInvoiceId: invoiceA.id,
  itemId: item1.id,
  description: 'Treatment service',
  cost: 100,
  qty: 1,
};

const estimateA = {
  id: '11111111-2222-3333-4444-999999999999',
  bookingId: bookingA.id,
  customerId: customerA.id,
  status: 'sent',
};

const estimateB = {
  id: '22222222-3333-4444-5555-666666666666',
  bookingId: bookingB.id,
  customerId: customerB.id,
  status: 'sent',
};

const estimateItemA = {
  id: '22222222-3333-4444-5555-777777777777',
  customerEstimateId: estimateA.id,
  itemId: item1.id,
  description: 'Quoted treatment',
  cost: 80,
  qty: 1,
};

const paymentMethodA = {
  id: '22222222-3333-4444-5555-888888888888',
  customerId: customerA.id,
  type: 'card',
  token: 'tok_visa_4242',
  isDefault: true,
};

const ledgerChargeA = {
  id: '22222222-3333-4444-5555-999999999999',
  customerId: customerA.id,
  type: 'charge',
  amount: 100,
};

const ledgerPaymentA = {
  id: '33333333-4444-5555-6666-777777777777',
  customerId: customerA.id,
  type: 'payment',
  amount: 40,
};

module.exports = {
  customerA,
  customerB,
  addressA,
  service1,
  item1,
  bookingA,
  bookingB,
  invoiceA,
  invoiceB,
  invoiceItemA,
  estimateA,
  estimateB,
  estimateItemA,
  paymentMethodA,
  ledgerChargeA,
  ledgerPaymentA,
};
