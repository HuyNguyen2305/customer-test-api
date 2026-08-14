import {
  PAGE_MARGIN,
  CONTENT_RIGHT,
  formatCurrency,
  formatDate,
  truncateId,
  renderPdfToBuffer,
  drawBrandHeader,
  drawAddressLines,
  drawTable,
  drawKeyValueList,
  drawTermsAndNotes,
} from '#common/pdf/pdf-kit.util.js';

const BILL_TO_TOP = 130;
const SERVICE_ADDRESS_X = 295;
const SERVICE_ADDRESS_WIDTH = 105;
const INFO_BOX_X = 405;
const INFO_BOX_WIDTH = CONTENT_RIGHT - INFO_BOX_X;
const ITEMS_TOP = 235;

function buildCityStateZip(address) {
  if (!address) return '';
  return [[address.city, address.state].filter(Boolean).join(', '), address.zip].filter(Boolean).join(' ');
}

function drawBillTo(doc, estimateData, customer, address) {
  const customerName = customer ? [customer.firstName, customer.lastName].filter(Boolean).join(' ') : '';
  const cityStateZip = buildCityStateZip(address);
  const addressLines = { name: customerName, line1: address?.line1, line2: address?.line2, cityStateZip };

  doc.font('Helvetica').fontSize(11).fillColor('black');
  drawAddressLines(doc, PAGE_MARGIN, BILL_TO_TOP, { ...addressLines, width: 260 });

  doc.font('Helvetica-Bold').fontSize(10).fillColor('black');
  doc.text('Service Address', SERVICE_ADDRESS_X, BILL_TO_TOP, { width: SERVICE_ADDRESS_WIDTH });
  const labelBottom = doc.y;

  doc.font('Helvetica').fontSize(10);
  drawAddressLines(doc, SERVICE_ADDRESS_X, labelBottom + 2, { ...addressLines, width: SERVICE_ADDRESS_WIDTH });
}

function drawEstimateInfoBox(doc, estimateData) {
  doc
    .rect(INFO_BOX_X, BILL_TO_TOP - 3, INFO_BOX_WIDTH, 66)
    .strokeColor('#cccccc')
    .stroke();
  const labelWidth = 78;
  drawKeyValueList(doc, {
    x: INFO_BOX_X + 6,
    labelWidth,
    valueWidth: INFO_BOX_WIDTH - 12 - labelWidth,
    startY: BILL_TO_TOP,
    rows: [
      ['Estimate #', truncateId(estimateData.id), true],
      ['Estimate Date', formatDate(estimateData.createdAt)],
      ['Estimate Total', formatCurrency(estimateData.total), true, true],
    ],
  });
}

const ITEM_COLUMNS = [
  { label: 'Item', x: PAGE_MARGIN, width: 300 },
  { label: 'Cost', x: 362, width: 70, align: 'right' },
  { label: 'Quantity', x: 442, width: 40, align: 'right' },
  { label: 'Total', x: 492, width: 70, align: 'right' },
];

function buildItemRows(items) {
  return items.map((item) => ({
    cells: [
      item.itemName || item.description || '',
      formatCurrency(item.cost),
      String(item.qty),
      formatCurrency(Number(item.cost) * Number(item.qty)),
    ],
    subLabel: item.itemName ? item.description : null,
    boldFirstCell: true,
  }));
}

function drawTotalsBlock(doc, estimateData, startY) {
  const rows = [
    ['Subtotal', formatCurrency(estimateData.subtotal)],
    ['Tax', formatCurrency(estimateData.taxTotal)],
    ['Estimate Total', formatCurrency(estimateData.total), true, true],
  ];
  drawKeyValueList(doc, { x: 380, labelWidth: 90, valueWidth: 82, startY, rows });
}

export function buildEstimatePdf(estimateData, { customer, address, branding } = {}) {
  return renderPdfToBuffer((doc) => {
    drawBrandHeader(doc, branding, 'ESTIMATE');
    drawBillTo(doc, estimateData, customer, address);
    drawEstimateInfoBox(doc, estimateData);
    const afterItems = drawTable(doc, {
      startY: ITEMS_TOP,
      columns: ITEM_COLUMNS,
      rows: buildItemRows(estimateData.items ?? []),
    });
    drawTermsAndNotes(doc, { termsText: estimateData.termsText, notesText: estimateData.notesText }, afterItems);
    drawTotalsBlock(doc, estimateData, afterItems);
  });
}

export default buildEstimatePdf;
