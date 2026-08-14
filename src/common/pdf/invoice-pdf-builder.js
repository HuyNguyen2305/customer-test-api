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

function drawPaidStamp(doc) {
  doc.moveTo(PAGE_MARGIN, 32).lineTo(CONTENT_RIGHT, 32).strokeColor('black').stroke();

  doc.save();
  doc.rotate(-15, { origin: [330, 90] });
  doc.lineWidth(2).strokeColor('green').roundedRect(275, 65, 110, 40, 4).stroke();
  doc.font('Helvetica-Bold').fontSize(22).fillColor('green').text('PAID', 275, 75, { width: 110, align: 'center' });
  doc.restore();
  doc.fillColor('black').strokeColor('black').lineWidth(1);
}

function buildCityStateZip(invoiceData) {
  return [[invoiceData.addressCity, invoiceData.addressState].filter(Boolean).join(', '), invoiceData.addressZip]
    .filter(Boolean)
    .join(' ');
}

function drawBillTo(doc, invoiceData, customer) {
  const top = 130;
  const customerName = customer ? [customer.firstName, customer.lastName].filter(Boolean).join(' ') : '';
  const cityStateZip = buildCityStateZip(invoiceData);
  const address = {
    name: customerName,
    line1: invoiceData.addressLine1,
    line2: invoiceData.addressLine2,
    cityStateZip,
  };

  doc.font('Helvetica').fontSize(11).fillColor('black');
  drawAddressLines(doc, PAGE_MARGIN, top, address);

  const rightColX = 325;
  const rightColWidth = 125;
  const contactColX = 460;
  const contactColWidth = CONTENT_RIGHT - contactColX;

  // Measure each label's own height instead of a hardcoded offset for the
  // address block below it - different fonts wrap "SERVICE ADDRESS"/"PRIMARY
  // CONTACT" at different points depending on their glyph widths, and a
  // fixed offset would let a wrapped label overlap the address underneath.
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#666666');
  doc.text('SERVICE ADDRESS', rightColX, top, { width: rightColWidth });
  const serviceLabelBottom = doc.y;
  doc.text('PRIMARY CONTACT', contactColX, top, { width: contactColWidth });
  const contactLabelBottom = doc.y;

  doc.font('Helvetica').fontSize(10).fillColor('black');
  drawAddressLines(doc, rightColX, serviceLabelBottom + 2, { ...address, width: rightColWidth });
  drawAddressLines(doc, contactColX, contactLabelBottom + 2, { name: customerName, width: contactColWidth });
}

function drawAccountInvoiceDateRow(doc, invoiceData, customer) {
  const top = 205;
  doc.font('Helvetica-Bold').fontSize(9).fillColor('black');
  doc.text(`ACCOUNT# ${truncateId(customer?.id ?? '')}`, PAGE_MARGIN, top);

  const barY = top + 18;
  doc.rect(330, barY, 232, 20).fillColor('#eeeeee').fill();
  doc.fillColor('black').font('Helvetica-Bold').fontSize(8);
  doc.text(`INVOICE ${truncateId(invoiceData.id)}`, 336, barY + 6, { width: 150 });
  doc
    .font('Helvetica')
    .fontSize(9)
    .text(formatDate(invoiceData.createdAt), 480, barY + 5, { width: 76, align: 'right' });

  return barY + 40;
}

const ITEM_COLUMNS = [
  { label: 'ITEM', x: PAGE_MARGIN, width: 300 },
  { label: 'COST', x: 362, width: 70, align: 'right' },
  { label: 'QTY', x: 442, width: 40, align: 'right' },
  { label: 'PRICE', x: 492, width: 70, align: 'right' },
];

function buildItemRows(items) {
  return items.map((item) => ({
    cells: [
      item.description || '',
      formatCurrency(item.cost),
      String(item.qty),
      formatCurrency(Number(item.cost) * Number(item.qty)),
    ],
  }));
}

function drawTotalsBlock(doc, invoiceData, accountBalance, startY) {
  const amountPaid = Math.max(Number(invoiceData.total) - Number(invoiceData.balanceDue), 0);
  const rows = [
    ['Subtotal', formatCurrency(invoiceData.subtotal)],
    ['Total', formatCurrency(invoiceData.total)],
    ['Amount Paid', formatCurrency(amountPaid)],
    ['Amount Due', formatCurrency(invoiceData.balanceDue), true],
    ['Account Balance', formatCurrency(accountBalance)],
    ['Balance Due', formatCurrency(accountBalance), true],
  ];
  drawKeyValueList(doc, { x: 380, labelWidth: 90, valueWidth: 82, startY, rows });
}

export function buildInvoicePdf(invoiceData, { customer, accountBalance = 0, branding } = {}) {
  return renderPdfToBuffer((doc) => {
    drawBrandHeader(doc, branding, 'INVOICE');
    if (invoiceData.status === 'paid') drawPaidStamp(doc);
    drawBillTo(doc, invoiceData, customer);
    const afterAccountRow = drawAccountInvoiceDateRow(doc, invoiceData, customer);
    const afterItems = drawTable(doc, {
      startY: afterAccountRow,
      columns: ITEM_COLUMNS,
      rows: buildItemRows(invoiceData.items ?? []),
    });
    drawTermsAndNotes(doc, { termsText: invoiceData.termsText, notesText: invoiceData.notesText }, afterItems);
    drawTotalsBlock(doc, invoiceData, accountBalance, afterItems);
  });
}

export default buildInvoicePdf;
