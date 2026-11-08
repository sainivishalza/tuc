import { describe, it, expect } from "vitest";
import { buildInvoicePdf, buildContractTemplatePdf } from "@/lib/pdfDocuments";
import type { QuoteRequest } from "@/lib/supabase/types";

const baseQuote: QuoteRequest = {
  id: "abcdef12-3456-7890-abcd-ef1234567890",
  name: "Test Client",
  email: "test@example.com",
  whatsapp: "+1 555 123 4567",
  product: "Bluetooth Speakers",
  quantity: "500 units",
  timeline: "30 days",
  message: null,
  items: null,
  status: "closed",
  quoted_value: 12500.5,
  created_at: "2026-11-08T00:00:00.000Z",
  followup_sent_at: null,
};

function isPdf(buf: Buffer): boolean {
  return buf.subarray(0, 5).toString("latin1") === "%PDF-";
}

/** pdfkit's TJ operator draws text as hex glyph runs interleaved with
 * numeric kerning adjustments — e.g. `<54686973> 10 <206167> TJ` — rather
 * than a single literal string, even with compress:false. WinAnsiEncoding
 * maps the ASCII range to itself, so decoding each hex run and
 * concatenating them in document order (skipping the kerning numbers)
 * reconstructs the original text losslessly for substring assertions. */
function extractPdfText(buf: Buffer): string {
  const raw = buf.toString("latin1");
  const hexRuns = raw.match(/<[0-9a-fA-F]+>/g) ?? [];
  return hexRuns.map((run) => Buffer.from(run.slice(1, -1), "hex").toString("latin1")).join("");
}

describe("buildInvoicePdf", () => {
  it("produces a valid, non-trivial PDF", async () => {
    const pdf = await buildInvoicePdf(baseQuote);
    expect(isPdf(pdf)).toBe(true);
    expect(pdf.length).toBeGreaterThan(500);
  });

  it("falls back to product/quantity when the quote has no line items", async () => {
    const pdf = await buildInvoicePdf(baseQuote);
    const text = extractPdfText(pdf);
    expect(text).toContain("Bluetooth Speakers");
  });

  it("renders every line item's description when items are present", async () => {
    const withItems: QuoteRequest = {
      ...baseQuote,
      items: [
        { product: "Model A", quantity: "300", notes: "" },
        { product: "Model B", quantity: "200", notes: "" },
      ],
    };
    const pdf = await buildInvoicePdf(withItems);
    const text = extractPdfText(pdf);
    expect(text).toContain("Model A");
    expect(text).toContain("Model B");
  });

  it("never claims a per-line amount it can't actually state", async () => {
    // Regression guard: line items only ever carry a description and
    // quantity (quote.items has no price field) — an "Amount" column
    // header here would always render blank, which is worse than no
    // column. See lib/pdfDocuments.ts.
    const pdf = await buildInvoicePdf(baseQuote);
    const text = extractPdfText(pdf);
    expect(text).not.toContain("AMOUNT");
  });
});

describe("buildContractTemplatePdf", () => {
  it("produces a valid, non-trivial PDF with the legal-review disclaimer", async () => {
    const pdf = await buildContractTemplatePdf();
    expect(isPdf(pdf)).toBe(true);
    const text = extractPdfText(pdf);
    expect(text).toContain("legal counsel");
  });
});
