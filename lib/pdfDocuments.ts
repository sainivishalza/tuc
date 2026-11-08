import "server-only";
import PDFDocument from "pdfkit";
import type { QuoteRequest } from "@/lib/supabase/types";

const BRAND_GREEN = "#059669";
const MUTED = "#5b6b64";

function newDoc(): { doc: PDFKit.PDFDocument; done: Promise<Buffer> } {
  // compress: false — these are one-or-two-page business documents, so
  // the size saving doesn't matter, and an uncompressed content stream
  // stays greppable/diffable (including by the unit tests below).
  const doc = new PDFDocument({ margin: 50, size: "A4", compress: false });
  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });
  return { doc, done };
}

function letterhead(doc: PDFKit.PDFDocument, label: string) {
  doc.fillColor(BRAND_GREEN).font("Helvetica-Bold").fontSize(10).text("THE UNIQUE CHOICE", { characterSpacing: 1 });
  doc.fillColor(MUTED).font("Helvetica").fontSize(9).text("China & Hong Kong Sourcing — theuniquechoice.com");
  doc.moveDown(1.2);
  doc.fillColor("#0f1c17").font("Helvetica-Bold").fontSize(20).text(label);
  doc.moveDown(1);
}

function money(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Only ever called for a quote with quoted_value already set — the
 * caller (the invoice Route Handler) checks that before generating. A
 * simple, factual document (what was quoted, to whom, for how much) —
 * no legal boilerplate, since an invoice just states amounts owed. */
export function buildInvoicePdf(quote: QuoteRequest): Promise<Buffer> {
  const { doc, done } = newDoc();
  const invoiceNumber = `INV-${quote.id.slice(0, 8).toUpperCase()}`;
  const issueDate = new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });

  letterhead(doc, "Invoice");

  doc.font("Helvetica").fontSize(10).fillColor("#0f1c17");
  doc.text(`Invoice #: ${invoiceNumber}`);
  doc.text(`Date: ${issueDate}`);
  doc.moveDown(1);

  doc.font("Helvetica-Bold").text("Bill To");
  doc.font("Helvetica").text(quote.name);
  doc.text(quote.email);
  if (quote.whatsapp) doc.text(quote.whatsapp);
  doc.moveDown(1.2);

  const items =
    quote.items && quote.items.length > 0
      ? quote.items.map((item) => ({ description: item.product, detail: item.quantity || "" }))
      : [{ description: quote.product || "Sourcing service", detail: quote.quantity || "" }];

  // Line items here only ever carry a description and quantity (never a
  // per-item price — quote.items has no price field), so the total below
  // is the only dollar figure this document states. No "Amount" column,
  // since one that's always blank is worse than no column at all.
  const colX = { description: doc.page.margins.left, detail: 400 };
  const tableWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  doc.font("Helvetica-Bold").fontSize(9).fillColor(MUTED);
  let y = doc.y;
  doc.text("DESCRIPTION", colX.description, y);
  doc.text("QUANTITY", colX.detail, y);
  y += 16;
  doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.margins.left + tableWidth, y).strokeColor("#dddddd").stroke();
  y += 8;

  doc.font("Helvetica").fontSize(10).fillColor("#0f1c17");
  for (const item of items) {
    doc.text(item.description, colX.description, y, { width: colX.detail - colX.description - 10 });
    doc.text(item.detail, colX.detail, y, { width: doc.page.margins.left + tableWidth - colX.detail });
    y += 20;
  }

  y += 10;
  doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.margins.left + tableWidth, y).strokeColor("#dddddd").stroke();
  y += 14;

  doc.font("Helvetica-Bold").fontSize(12);
  doc.text("Total", colX.detail, y);
  doc.text(money(quote.quoted_value ?? 0), colX.detail + 70, y);

  y += 50;
  doc.font("Helvetica").fontSize(9).fillColor(MUTED);
  doc.text(
    "Payment terms as agreed directly with The Unique Choice. Contact us on WhatsApp or by replying to your quote email with any questions about this invoice.",
    doc.page.margins.left,
    y,
    { width: tableWidth }
  );

  doc.end();
  return done;
}

/** A static, generic template — not a per-client auto-filled legal
 * document. Bracketed placeholders are meant to be filled in by hand (or
 * in a word processor after export) and the template is explicitly
 * marked as needing legal review before use, since this app has no
 * business generating binding contract language on its own authority. */
export function buildContractTemplatePdf(): Promise<Buffer> {
  const { doc, done } = newDoc();
  letterhead(doc, "Sourcing Service Agreement — Template");

  doc.font("Helvetica-Oblique").fontSize(9).fillColor("#b45309");
  doc.text(
    "This is a starting-point template, not a ready-to-sign legal contract. Review and adapt it with your own legal counsel before sending it to a client or supplier.",
    { width: doc.page.width - doc.page.margins.left - doc.page.margins.right }
  );
  doc.moveDown(1.2);

  const section = (heading: string, body: string) => {
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#0f1c17").text(heading);
    doc.moveDown(0.3);
    doc.font("Helvetica").fontSize(10).fillColor("#0f1c17").text(body, {
      width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
    });
    doc.moveDown(1);
  };

  doc.font("Helvetica").fontSize(10).fillColor(MUTED);
  doc.text("Agreement date: [DATE]");
  doc.text("Between: The Unique Choice (\"Agent\") and [CLIENT NAME] (\"Client\")");
  doc.moveDown(1);

  section(
    "1. Scope of Services",
    "Agent will provide sourcing services for the Client, including supplier identification, " +
      "negotiation support, quality inspection coordination, and shipment arrangement for the following " +
      "product(s): [DESCRIBE PRODUCT(S)]."
  );
  section(
    "2. Fees",
    "Client agrees to pay Agent [FEE STRUCTURE — e.g. a flat fee of $[AMOUNT], or a commission of [X]% of " +
      "the order value] for the services described above. Payment terms: [PAYMENT TERMS]."
  );
  section(
    "3. Timeline",
    "Agent will use reasonable efforts to complete sourcing and delivery within [TIMEFRAME] of order confirmation, " +
      "subject to supplier production schedules and shipping conditions outside Agent's control."
  );
  section(
    "4. Responsibilities",
    "Client is responsible for providing accurate product specifications and timely approval of samples, quotes, " +
      "and shipping documents. Agent is responsible for vetting suppliers and coordinating quality checks prior to shipment."
  );
  section(
    "5. Termination",
    "Either party may terminate this agreement with [NOTICE PERIOD] written notice. Fees for work already " +
      "performed remain payable."
  );
  section(
    "6. Governing Law",
    "This agreement is governed by the laws of [JURISDICTION]. [ADD ANY ADDITIONAL CLAUSES YOUR COUNSEL RECOMMENDS.]"
  );

  doc.moveDown(1);
  doc.font("Helvetica").fontSize(10).fillColor("#0f1c17");
  doc.text("Agent signature: _______________________        Date: ___________");
  doc.moveDown(0.8);
  doc.text("Client signature: ______________________        Date: ___________");

  doc.end();
  return done;
}
