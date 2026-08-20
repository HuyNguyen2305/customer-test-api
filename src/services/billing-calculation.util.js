// Shared subtotal/discount/tax math for Estimate and Invoice line items. Tax
// lives directly on each item row (up to 2 rate slots: tax1*/tax2*, snapshotted
// name/rate + a computed dollar total), not in a separate tax table - so this
// module's job is purely the arithmetic, computed once and persisted back onto
// the item columns by the caller.

// Postgres DECIMAL columns come back from Sequelize as strings, not numbers -
// fine for arithmetic (Number() coerces them fine) but fatal for a nullable
// `['number', 'null']` response schema, which fast-json-stringify checks
// strictly rather than coercing. Every nullable numeric field that reaches a
// response DTO goes through this first.
export function toNumberOrNull(value) {
  return value == null ? null : Number(value);
}

// customer_invoice_items persists its tax1*/tax2* fields nested under one
// taxSlots JSONB column, but the math below is shared with customer_estimate_items
// (which stays flat) - these two adapters keep that shared math working on a
// flat shape regardless, translating only at the invoice-item call sites.
//
// item.get({ plain: true }) rather than a bare spread: Sequelize instances
// expose attributes as prototype getters backed by dataValues, not as own
// enumerable properties, so `{ ...item }` silently drops every column (id
// included) and only copies Sequelize's internal bookkeeping fields instead.
export function flattenTaxSlots(item) {
  const plain = typeof item.get === 'function' ? item.get({ plain: true }) : item;
  return { ...plain, ...plain.taxSlots };
}

export function nestTaxSlotsPatch({ id, subtotal, total, ...taxSlots }) {
  return { id, subtotal, total, taxSlots };
}

// Round-trips through Postgres as a DECIMAL(12,2) column regardless, so
// computing here with more than 2 decimal digits would only let the
// in-memory response (built from these values, not a re-fetch) drift from
// what actually gets persisted.
function round2(value) {
  return Math.round(value * 100) / 100;
}

// Clamped to [0, 1]: a discount worth as much as or more than the subtotal
// it's applied to still can't tax (or total) an item into negative dollars.
export function computeDiscountRatio(subtotal, discountType, discountValue) {
  if (subtotal <= 0) return 0;
  const discountAmount = discountType === 'flat' ? Number(discountValue) : subtotal * (Number(discountValue) / 100);
  return Math.min(discountAmount / subtotal, 1);
}

// Pure per-item math: reads cost/qty and whichever tax1Rate/tax2Rate percentages
// are already on the item (a fresh snapshot from the caller, or carried over
// unchanged from a prior write), taxes each rate against the item's own
// discount-adjusted share, and returns the full column set to persist -
// tax1RateId/tax1Name/tax1Rate echoed straight through, tax1Total/subtotal/
// total freshly computed.
export function computeItemAmounts(item, discountRatio) {
  const subtotal = round2(Number(item.cost) * item.qty);
  const taxableBase = subtotal * (1 - discountRatio);

  const tax1Total = item.tax1Rate != null ? round2(taxableBase * (Number(item.tax1Rate) / 100)) : null;
  const tax2Total = item.tax2Rate != null ? round2(taxableBase * (Number(item.tax2Rate) / 100)) : null;

  return {
    subtotal,
    tax1RateId: item.tax1RateId ?? null,
    tax1Name: item.tax1Name ?? null,
    tax1Rate: item.tax1Rate ?? null,
    tax1Total,
    tax2RateId: item.tax2RateId ?? null,
    tax2Name: item.tax2Name ?? null,
    tax2Rate: item.tax2Rate ?? null,
    tax2Total,
    total: subtotal + (tax1Total ?? 0) + (tax2Total ?? 0),
  };
}

// Every item on the same invoice/estimate shares one discount ratio (it's
// derived from their combined subtotal), so adding/removing/editing any one
// item shifts every sibling's taxable base - this recomputes all of them in
// one pass, ready to persist back via a bulk item update.
export function recomputeItems(items, { discountType, discountValue }) {
  const list = items ?? [];
  const subtotal = list.reduce((sum, item) => sum + Number(item.cost) * item.qty, 0);
  const discountRatio = computeDiscountRatio(subtotal, discountType, discountValue);

  return list.map((item) => ({ id: item.id, ...computeItemAmounts(item, discountRatio) }));
}

// Rolls each item's tax1/tax2 slots up into one row per distinct rate,
// summing that rate's contribution across every item that references it -
// the read-side aggregate breakdown, computed from already-persisted item
// columns rather than a separate tax table.
function collectTaxRows(items) {
  const rows = new Map();
  for (const item of items) {
    for (const slot of [1, 2]) {
      const rateId = item[`tax${slot}RateId`];
      if (!rateId) continue;
      const amount = Number(item[`tax${slot}Total`] ?? 0);
      const existing = rows.get(rateId);
      if (existing) {
        existing.amount += amount;
      } else {
        rows.set(rateId, {
          id: rateId,
          name: item[`tax${slot}Name`],
          rate: toNumberOrNull(item[`tax${slot}Rate`]),
          amount,
        });
      }
    }
  }
  return [...rows.values()];
}

// Shared read-side shape for both Estimate and Invoice responses: subtotal/
// discountAmount/taxableAmount from items' persisted subtotal, tax breakdown
// rolled up from items' persisted tax1/tax2 slots.
export function computeEntityTotals({ items, discountType, discountValue }) {
  const list = items ?? [];

  const subtotal = list.reduce((sum, item) => sum + Number(item.subtotal ?? Number(item.cost) * item.qty), 0);
  const discountAmount = subtotal * computeDiscountRatio(subtotal, discountType, discountValue);
  const taxableAmount = subtotal - discountAmount;

  const taxes = collectTaxRows(list);
  const taxTotal = taxes.reduce((sum, tax) => sum + tax.amount, 0);

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    taxes,
    taxTotal,
    total: taxableAmount + taxTotal,
  };
}
