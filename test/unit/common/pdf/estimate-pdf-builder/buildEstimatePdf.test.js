import { jest } from '@jest/globals';
import { FakePDFDocument, getLastFakePdfDocument } from '../../../../helpers/fake-pdf-document.js';

jest.unstable_mockModule('pdfkit', () => ({ default: FakePDFDocument }));

const { buildEstimatePdf } = await import('#common/pdf/estimate-pdf-builder.js');

const baseEstimateData = {
  id: 'e1',
  status: 'sent',
  createdAt: '2026-08-11T00:00:00.000Z',
  termsText: null,
  notesText: null,
  subtotal: 65,
  taxTotal: 0,
  total: 65,
  items: [{ itemName: 'Bi-Monthly Service', description: 'General maintenance every other month.', cost: 65, qty: 1 }],
};

const branding = { companyName: 'Tho Dev', phone: '+11232412412', logoPlaceholderText: 'Replace logo' };
const customer = { id: 'c1', firstName: 'William', lastName: 'Saliba' };
const address = { line1: 'Wall Street', city: 'New York', state: 'NY', zip: '1232312' };

describe('buildEstimatePdf', () => {
  it('resolves a Buffer', async () => {
    const result = await buildEstimatePdf(baseEstimateData, { customer, address, branding });
    expect(Buffer.isBuffer(result)).toBe(true);
  });

  it('draws the item name and description as separate lines', async () => {
    await buildEstimatePdf(baseEstimateData, { customer, address, branding });

    const lastInstance = getLastFakePdfDocument();
    expect(lastInstance.textCalls).toContain('Bi-Monthly Service');
    expect(lastInstance.textCalls).toContain('General maintenance every other month.');
  });

  it('renders Subtotal/Tax/Estimate Total from the estimate data', async () => {
    const estimateData = { ...baseEstimateData, subtotal: 65, taxTotal: 0, total: 65 };
    await buildEstimatePdf(estimateData, { customer, address, branding });

    const lastInstance = getLastFakePdfDocument();
    expect(lastInstance.textCalls.filter((t) => t === '$65.00').length).toBeGreaterThanOrEqual(2);
    expect(lastInstance.textCalls).toContain('$0.00');
  });

  it('does not throw with empty items, null terms/notes, and no address', async () => {
    const emptyEstimateData = { ...baseEstimateData, items: [], termsText: null, notesText: null };
    await expect(buildEstimatePdf(emptyEstimateData, { customer, address: null, branding })).resolves.toBeInstanceOf(
      Buffer,
    );
  });
});
