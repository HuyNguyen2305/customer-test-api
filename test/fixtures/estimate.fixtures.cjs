module.exports = {
  estimateDraft: {
    customerId: '11111111-1111-1111-1111-111111111111',
    status: 'draft',
    amount: 500,
    description: 'Kitchen remodel estimate',
    validUntil: '2026-08-31',
  },
  estimateApproved: {
    customerId: '11111111-1111-1111-1111-111111111111',
    status: 'approved',
    amount: 1200.5,
    description: 'Bathroom renovation',
    validUntil: '2026-09-30',
  },
  estimateOtherCustomer: {
    customerId: '22222222-2222-2222-2222-222222222222',
    status: 'sent',
    amount: 300,
    description: 'Fence repair',
    validUntil: '2026-08-15',
  },
};
