/**
 * Minimal RFC4180-ish CSV parser — handles quoted fields (including
 * embedded commas and escaped "" quotes) without pulling in a parsing
 * library for what's a 3-column, user-uploaded file. Not meant for
 * exotic CSV dialects (different delimiters, BOM variants beyond the
 * one strip below).
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.replace(/^﻿/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < src.length; i++) {
    const char = src[i];

    if (inQuotes) {
      if (char === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

export interface CsvColumn {
  key: string;
  label: string;
}

/** The export direction's serializer — quotes a field only when it
 * actually contains a comma, quote, or newline, doubling any embedded
 * quotes, which is all real spreadsheet software needs to round-trip
 * admin-authored free text (messages, notes, addresses) correctly.
 * No "server-only" guard here since parseCsv above is used by a client
 * component (BulkQuoteForm) — this file is shared by both directions,
 * but toCsv/csvResponse are in practice only ever called from the
 * admin export Route Handlers (app/api/admin/export/*). */
export function toCsv(rows: Record<string, unknown>[], columns: CsvColumn[]): string {
  const escape = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    const str = String(value);
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const header = columns.map((c) => escape(c.label)).join(",");
  const lines = rows.map((row) => columns.map((c) => escape(row[c.key])).join(","));
  return [header, ...lines].join("\r\n");
}

/** A CSV download response — a plain `<a href>` (no JS, no blob/fetch
 * dance) to one of these routes is enough for the browser to save it,
 * since Content-Disposition: attachment is what actually triggers the
 * download rather than rendering the response inline. */
export function csvResponse(filename: string, csv: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
