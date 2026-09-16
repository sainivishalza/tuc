"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, UserPlus, CheckCircle } from "lucide-react";
import { addEmailProspect, bulkImportEmailProspects } from "@/lib/actions/emailCampaigns";
import { Button, inputClass, labelClass } from "@/components/admin/ui";

export function AddProspectForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await addEmailProspect(email, name, note);
      setEmail("");
      setName("");
      setNote("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Email *</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="contact@company.com" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Optional" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Note</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Where this lead came from" className={inputClass} />
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button type="submit" disabled={saving} size="sm" className="w-fit">
        <UserPlus size={13} />
        {saving ? "Adding..." : "Add prospect"}
      </Button>
    </form>
  );
}

export function BulkImportProspectsForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ added: number; total: number } | null>(null);
  const [importing, setImporting] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setText((prev) => `${prev}\n${String(reader.result ?? "")}`.trim());
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleImport() {
    setError("");
    setResult(null);
    setImporting(true);
    try {
      const outcome = await bulkImportEmailProspects(text);
      setResult(outcome);
      setText("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label className={labelClass}>Paste emails, or upload a CSV/TXT file — any format works, addresses are pulled out automatically</label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        placeholder={"jane@company.com\nJohn Smith <john@example.com>, mail@another.co\n..."}
        className={`resize-none ${inputClass}`}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
          <Upload size={13} />
          Upload file
        </Button>
        <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileChange} />
        <Button type="button" size="sm" disabled={importing || !text.trim()} onClick={handleImport}>
          {importing ? "Importing..." : "Import addresses"}
        </Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {result && (
        <p className="flex items-center gap-2 text-sm text-emerald-600">
          <CheckCircle size={14} />
          Found {result.total} address{result.total === 1 ? "" : "es"}, added {result.added} new{" "}
          {result.total - result.added > 0 ? `(${result.total - result.added} already on the list)` : ""}.
        </p>
      )}
    </div>
  );
}
