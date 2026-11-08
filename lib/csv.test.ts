import { describe, it, expect } from "vitest";
import { parseCsv, toCsv, csvResponse } from "@/lib/csv";

describe("parseCsv", () => {
  it("parses a simple comma-separated grid", () => {
    expect(parseCsv("a,b,c\n1,2,3")).toEqual([
      ["a", "b", "c"],
      ["1", "2", "3"],
    ]);
  });

  it("handles quoted fields with embedded commas", () => {
    expect(parseCsv('title,price\n"Widget, Deluxe",9.99')).toEqual([
      ["title", "price"],
      ["Widget, Deluxe", "9.99"],
    ]);
  });

  it("unescapes doubled quotes inside a quoted field", () => {
    expect(parseCsv('note\n"She said ""hi"""')).toEqual([["note"], ['She said "hi"']]);
  });

  it("strips a leading BOM and normalizes CRLF/CR line endings", () => {
    expect(parseCsv("﻿a,b\r\n1,2\r3,4")).toEqual([
      ["a", "b"],
      ["1", "2"],
      ["3", "4"],
    ]);
  });

  it("drops rows that are entirely blank", () => {
    expect(parseCsv("a,b\n1,2\n,\n3,4")).toEqual([
      ["a", "b"],
      ["1", "2"],
      ["3", "4"],
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(parseCsv("")).toEqual([]);
  });
});

describe("toCsv", () => {
  const columns = [
    { key: "name", label: "Name" },
    { key: "note", label: "Note" },
  ];

  it("writes a header row from column labels", () => {
    expect(toCsv([], columns)).toBe("Name,Note");
  });

  it("quotes a field containing a comma, quote, or newline", () => {
    const csv = toCsv([{ name: "Acme, Inc.", note: 'Said "hello"' }], columns);
    expect(csv).toBe('Name,Note\r\n"Acme, Inc.","Said ""hello"""');
  });

  it("leaves plain fields unquoted", () => {
    const csv = toCsv([{ name: "Acme", note: "fine" }], columns);
    expect(csv).toBe("Name,Note\r\nAcme,fine");
  });

  it("renders null/undefined values as an empty field", () => {
    const csv = toCsv([{ name: "Acme", note: null }], columns);
    expect(csv).toBe("Name,Note\r\nAcme,");
  });

  it("round-trips through parseCsv", () => {
    const rows = [
      { name: "Acme, Inc.", note: 'Said "hi"' },
      { name: "Widget Co", note: "plain text" },
    ];
    const csv = toCsv(rows, columns);
    const parsed = parseCsv(csv);
    expect(parsed).toEqual([
      ["Name", "Note"],
      ["Acme, Inc.", 'Said "hi"'],
      ["Widget Co", "plain text"],
    ]);
  });
});

describe("csvResponse", () => {
  it("sets a CSV content type and an attachment filename", async () => {
    const res = csvResponse("export.csv", "a,b\n1,2");
    expect(res.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    expect(res.headers.get("Content-Disposition")).toBe('attachment; filename="export.csv"');
    expect(await res.text()).toBe("a,b\n1,2");
  });
});
