import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';

const FONTS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fonts');

// PDFKit's built-in "Helvetica"/"Helvetica-Bold" only cover WinAnsi
// (roughly Western-European Latin-1) - any other script (Vietnamese,
// Cyrillic, etc.) or emoji silently renders as the wrong glyphs instead of
// throwing. Registering a Unicode-capable TTF under those exact standard
// font names transparently overrides every `.font('Helvetica')` call site
// in this module and the two builders with zero other code changes, since
// PDFKit's `.font(name)` checks registered fonts by name before falling
// back to the built-in standard fonts.
const REGULAR_FONT_BUFFER = fs.readFileSync(path.join(FONTS_DIR, 'DejaVuSans.ttf'));
const BOLD_FONT_BUFFER = fs.readFileSync(path.join(FONTS_DIR, 'DejaVuSans-Bold.ttf'));

function registerUnicodeFonts(doc) {
  doc.registerFont('Helvetica', REGULAR_FONT_BUFFER);
  doc.registerFont('Helvetica-Bold', BOLD_FONT_BUFFER);
}

export const PAGE_MARGIN = 50;
export const PAGE_WIDTH = 612; // Letter
export const CONTENT_RIGHT = PAGE_WIDTH - PAGE_MARGIN;

export function formatCurrency(value) {
  const amount = Number(value ?? 0);
  const sign = amount < 0 ? '-' : '';
  return `${sign}$${Math.abs(amount).toFixed(2)}`;
}

// PDFKit's `ellipsis` option only clamps the *last* line of a wrapped block,
// not a single line, so a long raw UUID rendered at a narrow column width
// still wraps to multiple lines and overflows a fixed-height box. Truncating
// the string up front keeps document/reference numbers on one line.
export function truncateId(id, length = 8) {
  if (!id) return '';
  return id.length > length ? `${id.slice(0, length)}…` : id;
}

export function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  // UTC getters, not local-time getters: this runs on whatever timezone the
  // server happens to be deployed in, and a local-time read of a
  // UTC-midnight timestamp rolls back to the previous calendar day for any
  // negative UTC offset (all of the Americas) - the date must be
  // deterministic regardless of server timezone.
  return `${String(date.getUTCMonth() + 1).padStart(2, '0')}/${String(date.getUTCDate()).padStart(2, '0')}/${date.getUTCFullYear()}`;
}

export function renderPdfToBuffer(draw) {
  return new Promise((resolve, reject) => {
    // `font: false` skips PDFDocument's constructor eagerly calling
    // `.font('Helvetica')` itself - that call caches the built-in standard
    // font under the name 'Helvetica' before registerUnicodeFonts() below
    // ever runs, which would otherwise permanently shadow the registered
    // override for that name.
    const doc = new PDFDocument({ size: 'LETTER', margin: PAGE_MARGIN, font: false });
    registerUnicodeFonts(doc);
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      draw(doc);
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export function drawBrandHeader(doc, branding, titleText) {
  doc.font('Helvetica-Bold').fontSize(14).fillColor('black').text(branding.companyName, PAGE_MARGIN, 40);
  if (branding.phone) {
    doc.font('Helvetica').fontSize(10).text(branding.phone, PAGE_MARGIN, 60);
  }

  doc.font('Helvetica-Bold').fontSize(26).text(titleText, PAGE_MARGIN, 40, { width: 512, align: 'center' });

  const logoBoxX = CONTENT_RIGHT - 150;
  doc.rect(logoBoxX, 40, 150, 50).strokeColor('#cccccc').stroke();
  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#999999')
    .text(branding.logoPlaceholderText, logoBoxX + 5, 60, { width: 140, align: 'center' });
  doc.fillColor('black');
}

export function drawAddressLines(doc, x, y, { name, line1, line2, cityStateZip, width }) {
  const textOptions = width ? { width } : undefined;
  doc.text(name || '', x, y, textOptions);
  let cursorY = doc.y;
  if (line1) {
    doc.text(line1, x, cursorY, textOptions);
    cursorY = doc.y;
  }
  if (line2) {
    doc.text(line2, x, cursorY, textOptions);
    cursorY = doc.y;
  }
  if (cityStateZip) {
    doc.text(cityStateZip, x, cursorY, textOptions);
    cursorY = doc.y;
  }
  return cursorY;
}

export function drawTable(doc, { startY, columns, rows }) {
  let y = startY;
  doc.rect(PAGE_MARGIN, y, 512, 18).fillColor('#808080').fill();
  doc.fillColor('white').font('Helvetica-Bold').fontSize(8);
  columns.forEach((col) => doc.text(col.label, col.x, y + 5, { width: col.width, align: col.align ?? 'left' }));
  doc.fillColor('black');
  y += 24;

  for (const row of rows) {
    if (y > doc.page.height - 150) {
      doc.addPage();
      y = PAGE_MARGIN;
    }
    // A cell's text can wrap to more than one line (long item names/
    // descriptions), so the row must advance by the tallest cell actually
    // drawn, not a fixed line height - otherwise a wrapped cell overlaps
    // whatever is drawn immediately below it (next row, totals block, etc).
    let rowHeight = 16;
    columns.forEach((col, index) => {
      doc.font(row.boldFirstCell && index === 0 ? 'Helvetica-Bold' : 'Helvetica').fontSize(10);
      const cellText = row.cells[index] ?? '';
      rowHeight = Math.max(rowHeight, doc.heightOfString(cellText, { width: col.width, align: col.align ?? 'left' }));
      doc.text(cellText, col.x, y, { width: col.width, align: col.align ?? 'left' });
    });
    y += rowHeight;

    if (row.subLabel) {
      doc.font('Helvetica').fontSize(9).fillColor('#666666');
      doc.text(row.subLabel, columns[0].x, y, { width: columns[0].width });
      doc.fillColor('black');
      y = doc.y + 4;
    } else {
      y += 4;
    }
  }

  return y + 10;
}

export function drawKeyValueList(doc, { x, labelWidth, valueWidth, startY, rows }) {
  let y = startY;
  for (const [label, value, bold, highlight, valueOptions] of rows) {
    if (highlight) {
      doc
        .rect(x, y - 3, labelWidth + valueWidth, 18)
        .fillColor('#eeeeee')
        .fill();
      doc.fillColor('black');
    }
    doc.font(bold || highlight ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
    doc.text(label, x, y, { width: labelWidth, lineBreak: false, ellipsis: true });
    doc.text(value, x + labelWidth, y, { width: valueWidth, align: 'right', ...valueOptions });
    y += 16;
  }
  return y;
}

export function drawTermsAndNotes(doc, { termsText, notesText }, startY) {
  let y = startY;
  if (termsText) {
    doc.font('Helvetica-Bold').fontSize(9).text('Terms', PAGE_MARGIN, y);
    y += 14;
    doc.font('Helvetica').fontSize(9).text(termsText, PAGE_MARGIN, y, { width: 300 });
    y = doc.y + 10;
  }
  if (notesText) {
    doc.font('Helvetica-Bold').fontSize(9).text('Notes', PAGE_MARGIN, y);
    y += 14;
    doc.font('Helvetica').fontSize(9).text(notesText, PAGE_MARGIN, y, { width: 300 });
    y = doc.y + 10;
  }
  return y;
}
