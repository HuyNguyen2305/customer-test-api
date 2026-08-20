import {
  computeDiscountRatio,
  computeItemAmounts,
  recomputeItems,
  computeEntityTotals,
  flattenTaxSlots,
  nestTaxSlotsPatch,
} from '#service/billing-calculation.util.js';

describe('computeDiscountRatio', () => {
  it('returns 0 when the subtotal is zero or negative', () => {
    expect(computeDiscountRatio(0, 'flat', 10)).toBe(0);
    expect(computeDiscountRatio(-5, 'flat', 10)).toBe(0);
  });

  it('computes a flat discount as a fraction of the subtotal', () => {
    expect(computeDiscountRatio(200, 'flat', 50)).toBe(0.25);
  });

  it('computes a percent discount directly as the ratio', () => {
    expect(computeDiscountRatio(200, 'percent', 10)).toBe(0.1);
  });

  it('clamps to 1 when a flat discount is larger than the subtotal', () => {
    expect(computeDiscountRatio(50, 'flat', 200)).toBe(1);
  });

  it('clamps to 1 when a percent discount is over 100', () => {
    expect(computeDiscountRatio(100, 'percent', 150)).toBe(1);
  });
});

describe('computeItemAmounts', () => {
  it('taxes the item on its discount-adjusted share for both tax slots', () => {
    const item = { cost: 100, qty: 1, tax1RateId: 't1', tax1Name: 'NY', tax1Rate: 4, tax2RateId: null, tax2Rate: null };

    const result = computeItemAmounts(item, 0.5);

    expect(result.subtotal).toBe(100);
    expect(result.tax1Total).toBe(2); // (100 * (1 - 0.5)) * 4%
    expect(result.tax2Total).toBeNull();
    expect(result.total).toBe(102);
  });

  it('sums both tax slots into total when both are present', () => {
    const item = { cost: 100, qty: 2, tax1Rate: 4, tax2Rate: 6.25 };

    const result = computeItemAmounts(item, 0);

    expect(result.subtotal).toBe(200);
    expect(result.tax1Total).toBe(8);
    expect(result.tax2Total).toBe(12.5);
    expect(result.total).toBe(220.5);
  });

  it('leaves both tax totals null and total equal to subtotal when no rate is assigned', () => {
    const item = { cost: 50, qty: 1, tax1Rate: null, tax2Rate: null };

    const result = computeItemAmounts(item, 0.1);

    expect(result.tax1Total).toBeNull();
    expect(result.tax2Total).toBeNull();
    expect(result.total).toBe(50);
  });

  it('never goes negative when the discount ratio is clamped at 1 (discount >= subtotal)', () => {
    const item = { cost: 50, qty: 1, tax1Rate: 8 };

    const result = computeItemAmounts(item, 1);

    expect(result.tax1Total).toBe(0);
    expect(result.total).toBe(50);
  });

  it('rounds subtotal/tax1Total/tax2Total to 2 decimals, and total never drifts from their sum', () => {
    // Unrounded this would be tax1Total: 2.4747525, tax2Total: 1.8748125 - the
    // exact drift reproduced against the live DB (Postgres rounds DECIMAL(12,2)
    // on write, so an unrounded in-memory value never matches what's persisted).
    const item = { cost: 33.33, qty: 1, tax1Rate: 8.25, tax2Rate: 6.25 };

    const result = computeItemAmounts(item, 0.1);

    expect(result.subtotal).toBe(33.33);
    expect(result.tax1Total).toBe(2.47);
    expect(result.tax2Total).toBe(1.87);
    expect(result.total).toBe(result.subtotal + result.tax1Total + result.tax2Total);
  });
});

describe('recomputeItems', () => {
  it("derives one discount ratio from the combined subtotal and applies it to every item's own tax", () => {
    const items = [
      { id: 'i1', cost: 30, qty: 1, tax1Rate: 5 },
      { id: 'i2', cost: 70, qty: 1, tax1Rate: 10 },
    ];

    const patches = recomputeItems(items, { discountType: 'flat', discountValue: 20 });

    // subtotal 100, discount 20 -> ratio 0.2 -> i1 taxable 24, i2 taxable 56
    expect(patches.find((p) => p.id === 'i1').tax1Total).toBeCloseTo(1.2, 10);
    expect(patches.find((p) => p.id === 'i2').tax1Total).toBeCloseTo(5.6, 10);
  });

  it('returns an empty array for no items', () => {
    expect(recomputeItems(undefined, { discountType: 'flat', discountValue: 0 })).toEqual([]);
  });

  it('never produces negative tax or total when the combined discount exceeds the subtotal', () => {
    const items = [{ id: 'i1', cost: 50, qty: 1, tax1Rate: 8 }];

    const patches = recomputeItems(items, { discountType: 'flat', discountValue: 200 });

    expect(patches[0].tax1Total).toBe(0);
    expect(patches[0].total).toBe(50);
  });
});

describe('computeEntityTotals', () => {
  it('computes subtotal/discount/taxable amount from items', () => {
    const result = computeEntityTotals({
      items: [{ subtotal: 200, tax1RateId: null, tax2RateId: null }],
      discountType: 'percent',
      discountValue: 10,
    });

    expect(result.subtotal).toBe(200);
    expect(result.discountAmount).toBe(20);
    expect(result.taxableAmount).toBe(180);
    expect(result.total).toBe(180);
  });

  it("rolls each item's tax1/tax2 slots up into one row per distinct rate", () => {
    const result = computeEntityTotals({
      items: [
        { subtotal: 30, tax1RateId: 'tax-a', tax1Name: 'A', tax1Rate: 5, tax1Total: 1.5, tax2RateId: null },
        { subtotal: 70, tax1RateId: 'tax-b', tax1Name: 'B', tax1Rate: 10, tax1Total: 7, tax2RateId: null },
      ],
      discountType: 'flat',
      discountValue: 0,
    });

    expect(result.taxes).toEqual([
      { id: 'tax-a', name: 'A', rate: 5, amount: 1.5 },
      { id: 'tax-b', name: 'B', rate: 10, amount: 7 },
    ]);
    expect(result.taxTotal).toBe(8.5);
    expect(result.total).toBe(108.5);
  });

  it('sums contributions from multiple items sharing the same tax rate', () => {
    const result = computeEntityTotals({
      items: [
        { subtotal: 30, tax1RateId: 'tax-a', tax1Name: 'A', tax1Rate: 5, tax1Total: 1.5, tax2RateId: null },
        { subtotal: 20, tax1RateId: 'tax-a', tax1Name: 'A', tax1Rate: 5, tax1Total: 1, tax2RateId: null },
      ],
      discountType: 'flat',
      discountValue: 0,
    });

    expect(result.taxes).toEqual([{ id: 'tax-a', name: 'A', rate: 5, amount: 2.5 }]);
  });

  it('rolls up both tax1 and tax2 slots on the same item as separate rows', () => {
    const result = computeEntityTotals({
      items: [
        {
          subtotal: 100,
          tax1RateId: 'tax-a',
          tax1Name: 'A',
          tax1Rate: 4,
          tax1Total: 4,
          tax2RateId: 'tax-b',
          tax2Name: 'B',
          tax2Rate: 6.25,
          tax2Total: 6.25,
        },
      ],
      discountType: 'flat',
      discountValue: 0,
    });

    expect(result.taxes).toEqual([
      { id: 'tax-a', name: 'A', rate: 4, amount: 4 },
      { id: 'tax-b', name: 'B', rate: 6.25, amount: 6.25 },
    ]);
    expect(result.taxTotal).toBe(10.25);
  });

  it('falls back to cost*qty for subtotal when an item has no persisted subtotal yet', () => {
    const result = computeEntityTotals({
      items: [{ cost: 40, qty: 2, tax1RateId: null, tax2RateId: null }],
      discountType: 'flat',
      discountValue: 0,
    });

    expect(result.subtotal).toBe(80);
  });

  it('clamps discountAmount/taxableAmount/total at 0 instead of going negative when the flat discount exceeds the subtotal', () => {
    const result = computeEntityTotals({
      items: [{ subtotal: 50, tax1RateId: null, tax2RateId: null }],
      discountType: 'flat',
      discountValue: 200,
    });

    expect(result.discountAmount).toBe(50);
    expect(result.taxableAmount).toBe(0);
    expect(result.total).toBe(0);
  });
});

describe('flattenTaxSlots', () => {
  it('spreads a nested taxSlots object onto the item as flat keys', () => {
    const item = { id: 'ii1', cost: 30, qty: 1, taxSlots: { tax1RateId: 't1', tax1Rate: 5 } };

    expect(flattenTaxSlots(item)).toEqual({
      id: 'ii1',
      cost: 30,
      qty: 1,
      taxSlots: { tax1RateId: 't1', tax1Rate: 5 },
      tax1RateId: 't1',
      tax1Rate: 5,
    });
  });

  it('leaves the item unchanged (no flat tax keys added) when taxSlots is absent', () => {
    const item = { id: 'ii1', cost: 30, qty: 1 };

    expect(flattenTaxSlots(item)).toEqual({ id: 'ii1', cost: 30, qty: 1 });
  });

  it('reads through .get({plain:true}) instead of spreading the instance directly, for a Sequelize-instance-shaped item', () => {
    // Real Sequelize instances expose attributes as prototype getters, not own
    // enumerable properties - {...item} silently drops all real data and only
    // copies bookkeeping fields (dataValues, _changed, etc). This test's fake
    // instance mimics that shape (data reachable only via .get(), not via a
    // bare spread) so a regression back to a plain `{...item, ...item.taxSlots}`
    // would fail here even though it might look fine against a plain object.
    const fakeSequelizeInstance = {
      dataValues: { id: 'ii1', cost: 30, qty: 1, taxSlots: { tax1RateId: 't1', tax1Rate: 5 } },
      get({ plain }) {
        if (!plain) throw new Error('flattenTaxSlots must call get({ plain: true })');
        return { id: 'ii1', cost: 30, qty: 1, taxSlots: { tax1RateId: 't1', tax1Rate: 5 } };
      },
    };

    expect(flattenTaxSlots(fakeSequelizeInstance)).toEqual({
      id: 'ii1',
      cost: 30,
      qty: 1,
      taxSlots: { tax1RateId: 't1', tax1Rate: 5 },
      tax1RateId: 't1',
      tax1Rate: 5,
    });
  });
});

describe('nestTaxSlotsPatch', () => {
  it('buckets the 8 tax keys under taxSlots, leaving id/subtotal/total flat', () => {
    const flatPatch = {
      id: 'ii1',
      subtotal: 100,
      tax1RateId: 't1',
      tax1Name: 'NY',
      tax1Rate: 4,
      tax1Total: 4,
      tax2RateId: null,
      tax2Name: null,
      tax2Rate: null,
      tax2Total: null,
      total: 104,
    };

    expect(nestTaxSlotsPatch(flatPatch)).toEqual({
      id: 'ii1',
      subtotal: 100,
      total: 104,
      taxSlots: {
        tax1RateId: 't1',
        tax1Name: 'NY',
        tax1Rate: 4,
        tax1Total: 4,
        tax2RateId: null,
        tax2Name: null,
        tax2Rate: null,
        tax2Total: null,
      },
    });
  });
});
