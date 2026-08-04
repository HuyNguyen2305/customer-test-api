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

const customerC = {
  id: 'cccccccc-9999-8888-7777-666666666666',
  firstName: 'Carol',
  lastName: 'Carter',
  email: 'carol@example.com',
  mobile: '555-0003',
};

const addressA = {
  id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  customerId: customerA.id,
  label: 'Home',
  line1: '1 Main St',
  isDefault: true,
};

const addressA2 = {
  id: 'cccccccc-dddd-eeee-ffff-000000000000',
  customerId: customerA.id,
  label: 'Work',
  line1: '2 Market St',
  isDefault: false,
};

const addressB = {
  id: 'cccccccc-1111-2222-3333-444444444444',
  customerId: customerB.id,
  label: 'Home',
  line1: '9 Bob St',
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

const bookingA2 = {
  id: '77777777-8888-9999-aaaa-bbbbbbbbbbbb',
  serviceId: service1.id,
  customerId: customerA.id,
  addressId: addressA.id,
  startTime: new Date('2026-01-03T10:00:00Z'),
  endTime: new Date('2026-01-03T11:00:00Z'),
  status: 'completed',
};

const bookingA3Pending = {
  id: '77777777-8888-9999-aaaa-cccccccccccc',
  serviceId: service1.id,
  customerId: customerA.id,
  startTime: new Date('2026-01-04T10:00:00Z'),
  endTime: new Date('2026-01-04T11:00:00Z'),
  status: 'pending',
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

const paymentMethodA2 = {
  id: '22222222-4444-5555-6666-777777777777',
  customerId: customerA.id,
  type: 'bank',
  token: 'tok_bank_5678',
  isDefault: false,
};

const paymentMethodB = {
  id: '22222222-5555-6666-7777-888888888888',
  customerId: customerB.id,
  type: 'card',
  token: 'tok_visa_9999',
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

const ledgerChargeA2 = {
  id: '33333333-4444-5555-6666-888888888888',
  customerId: customerA.id,
  type: 'charge',
  amount: 30,
};

const ledgerPaymentA2 = {
  id: '33333333-4444-5555-6666-999999999999',
  customerId: customerA.id,
  type: 'payment',
  amount: 10,
};

const serviceDocLibraryA = {
  id: '44444444-5555-6666-7777-888888888888',
  name: 'Service Agreement',
  filePath: 'service-agreement.pdf',
  originalFileName: 'Service Agreement.pdf',
  fileSize: 1024,
};

const pdfA = {
  id: '44444444-5555-6666-7777-999999999999',
  name: 'Inspection Report.pdf',
  filePath: 'inspection-report.pdf',
  originalFileName: 'Inspection Report.pdf',
  fileSize: 2048,
};

const customerDocumentA = {
  id: '55555555-6666-7777-8888-999999999999',
  customerId: customerA.id,
  bookingId: bookingA.id,
  documentId: serviceDocLibraryA.id,
  type: 'doc',
};

const customerDocumentB = {
  id: '66666666-7777-8888-9999-aaaaaaaaaaaa',
  customerId: customerB.id,
  bookingId: bookingB.id,
  pdfId: pdfA.id,
  type: 'pdf',
};

module.exports = {
  customerA,
  customerB,
  customerC,
  addressA,
  addressA2,
  addressB,
  service1,
  item1,
  bookingA,
  bookingB,
  bookingA2,
  bookingA3Pending,
  invoiceA,
  invoiceB,
  invoiceItemA,
  estimateA,
  estimateB,
  estimateItemA,
  paymentMethodA,
  paymentMethodA2,
  paymentMethodB,
  ledgerChargeA,
  ledgerPaymentA,
  ledgerChargeA2,
  ledgerPaymentA2,
  serviceDocLibraryA,
  pdfA,
  customerDocumentA,
  customerDocumentB,
};
