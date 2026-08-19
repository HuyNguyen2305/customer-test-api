module.exports = {
  squareCard: {
    customerId: '11111111-1111-1111-1111-111111111111',
    type: 'card',
    paymentDetails: { gateway: 'square', token: 'sq_card_test_1', gatewayCustomerId: 'sq_cust_test_1' },
    isDefault: true,
  },
  stripeCard: {
    customerId: '11111111-1111-1111-1111-111111111111',
    type: 'card',
    paymentDetails: { gateway: 'stripe', token: 'pm_test_1', gatewayCustomerId: 'cus_test_1' },
    isDefault: false,
  },
  openCredit: {
    customerId: '11111111-1111-1111-1111-111111111111',
    type: 'open_credit',
    paymentDetails: { creditBalance: 200 },
    isDefault: false,
  },
};
