"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, UploadCloud, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { bulkImportSuppliers } from "@/lib/actions/suppliers";
import { Button, inputClass, labelClass } from "@/components/admin/ui";

const TEMPLATE_HEADER = "company_name,contact_name,email,phone,product_categories,business_address,country,bio,notes,tier,status";
const TEMPLATE_EXAMPLE =
  "Shenzhen Example Co., Ltd.,Wei Zhang,sales@example.com,+86 123 4567 8900,Electronics & Gadgets,\"Shenzhen, Guangdong\",China,10 years making Bluetooth speakers,Met at Canton Fair 2026,gold,approved";

/** Admin-only — seeds many already-known, real suppliers at once instead
 * of each one going through the public registration form individually.
 * Same collapsible-panel, paste-or-upload shape as the supplier portal's
 * BulkProductImportForm, just in the admin gray theme instead of the
 * public "glass" one. */
export default function BulkSupplierImportForm() {
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
    try {
      const outcome = await bulkImportSuppliers(text);
      if (outcome.errors.length > 0) {
        setError(outcome.errors[0]);
        return;
      }
      setResult({ imported: outcome.imported, skipped: outcome.skipped });
      setText("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-semibold text-gray-900"
      >
        <span className="flex items-center gap-2">
          <UploadCloud size={16} />
          Bulk import suppliers from a CSV
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="flex flex-col gap-3 border-t border-gray-100 p-4">
          <p className="text-xs text-gray-500">
            For onboarding suppliers you already know — add many at once instead of each one registering individually.
            Only <code className="rounded bg-gray-100 px-1">company_name</code>, <code className="rounded bg-gray-100 px-1">contact_name</code>,
            and <code className="rounded bg-gray-100 px-1">email</code> are required. <code className="rounded bg-gray-100 px-1">status</code>{" "}
            defaults to &quot;pending&quot; (same review gate as the public form) unless set to &quot;approved&quot; or &quot;rejected&quot;.
            A row whose email already belongs to an existing supplier is skipped. Business license, visiting card, and photos
            can&apos;t be imported this way — add them afterward by editing the supplier.
          </p>
          <div className="overflow-x-auto rounded-lg bg-gray-50 p-3 text-[11px]">
            <p className="font-mono text-gray-500">{TEMPLATE_HEADER}</p>
            <p className="mt-1 font-mono text-gray-800">{TEMPLATE_EXAMPLE}</p>
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
              className="flex items-center gap-1.5 rounded-xl border-2 border-dashed border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 transition hover:border-accent/50 hover:text-gray-800"
            >
              <Upload size={14} />
              Upload file
            </button>
            <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileChange} />
            <Button disabled={importing || !text.trim()} onClick={handleImport}>
              {importing ? "Importing..." : "Import suppliers"}
            </Button>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          {result && (
            <p className="flex items-center gap-2 text-sm text-emerald-600">
              <CheckCircle size={14} />
              Imported {result.imported} supplier{result.imported === 1 ? "" : "s"}
              {result.skipped > 0 ? ` (${result.skipped} row${result.skipped === 1 ? "" : "s"} skipped — missing fields or duplicate email)` : ""}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
