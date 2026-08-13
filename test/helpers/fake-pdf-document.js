let lastInstance;

// Minimal chainable stand-in for pdfkit's PDFDocument, used to unit-test PDF
// builders without a real PDF renderer: records drawn text/moveTo calls so
// tests can assert on content, and synchronously fires the 'data'/'end'
// stream events real PDFKit would emit asynchronously.
export class FakePDFDocument {
  constructor(options) {
    this.options = options;
    this.page = { height: 792 };
    this.y = 40;
    this._handlers = {};
    this.textCalls = [];
    this.moveToCalls = [];
    lastInstance = this;
  }

  on(event, cb) {
    this._handlers[event] = cb;
    return this;
  }

  text(str) {
    this.textCalls.push(str);
    return this;
  }

  moveTo(...args) {
    this.moveToCalls.push(args);
    return this;
  }

  lineTo() {
    return this;
  }

  font() {
    return this;
  }

  fontSize() {
    return this;
  }

  fillColor() {
    return this;
  }

  strokeColor() {
    return this;
  }

  lineWidth() {
    return this;
  }

  rect() {
    return this;
  }

  roundedRect() {
    return this;
  }

  stroke() {
    return this;
  }

  fill() {
    return this;
  }

  save() {
    return this;
  }

  restore() {
    return this;
  }

  rotate() {
    return this;
  }

  addPage() {
    return this;
  }

  end() {
    this._handlers.data?.(Buffer.from('%PDF-'));
    this._handlers.end?.();
  }
}

export function getLastFakePdfDocument() {
  return lastInstance;
}
