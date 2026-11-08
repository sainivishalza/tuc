"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, UploadCloud, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { bulkImportProducts } from "@/lib/actions/supplierProducts";

const inputClass =
  "w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
const labelClass = "mb-2 block text-sm font-medium";

const TEMPLATE_HEADER = "title,description,category,price,price_unit,moq,lead_time,unit,customizable,sample_available,sample_price,port_of_shipment";
const TEMPLATE_EXAMPLE =
  "Stainless Steel Water Bottle,500ml double-wall insulated,Home & Kitchen,3.50,USD/piece,500 pieces,20 days,piece,yes,yes,15,Shenzhen";

export default function BulkProductImportForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [importing, setImporting] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setText(String(reader.result ?? ""));
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleImport() {
    setError("");
    setResult(null);
    setImporting(true);
    const outcome = await bulkImportProducts(text);
    setImporting(false);
    if (outcome.errors.length > 0) {
      setError(outcome.errors[0]);
      return;
    }
    setResult({ imported: outcome.imported, skipped: outcome.skipped });
    setText("");
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold"
      >
        <span className="flex items-center gap-2">
          <UploadCloud size={16} />
          Bulk import products from a CSV
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="flex flex-col gap-3 border-t border-border p-4">
          <p className="text-xs text-muted">
            For a large catalog — add many products at once instead of one at a time. Only{" "}
            <code className="rounded bg-surface-2 px-1">title</code> is required; every other column is optional.
            Photos can&apos;t be imported this way — add them afterward from the list below.
          </p>
          <div className="overflow-x-auto rounded-lg bg-surface-2 p-3 text-[11px]">
            <p className="font-mono text-muted">{TEMPLATE_HEADER}</p>
            <p className="mt-1 font-mono text-foreground">{TEMPLATE_EXAMPLE}</p>
          </div>
          <label className={labelClass}>Paste your CSV, or upload a file</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder={TEMPLATE_HEADER}
            className={`resize-none font-mono text-xs ${inputClass}`}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 rounded-xl border-2 border-dashed border-border px-4 py-2 text-sm font-medium text-muted transition hover:border-accent/50 hover:text-foreground"
            >
              <Upload size={14} />
              Upload file
            </button>
            <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileChange} />
            <button type="button" disabled={importing || !text.trim()} onClick={handleImport} className="btn-primary">
              {importing ? "Importing..." : "Import products"}
            </button>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {result && (
            <p className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle size={14} />
              Imported {result.imported} product{result.imported === 1 ? "" : "s"}
              {result.skipped > 0 ? ` (${result.skipped} row${result.skipped === 1 ? "" : "s"} skipped — missing title)` : ""}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
