"use client";

import { useState } from "react";
import { FileCheck2, ArrowRight, Check } from "lucide-react";
import Reveal from "./Reveal";
import { SectionHeading } from "./Services";
import { trackCtaClick } from "@/lib/analytics";
import { usePathname } from "next/navigation";
import type { Dictionary, Locale } from "@/lib/i18n";
import { getCategoryProfiles } from "@/lib/productMatcher";
import { getCoreDocuments, buildDocumentChecklist } from "@/lib/documentChecklist";

export default function DocumentChecklist({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const t = dict.tools.documentChecklist;
  const categories = getCategoryProfiles(dict.tools.categories);
  const coreDocuments = getCoreDocuments(t.coreDocuments);

  const [categoryId, setCategoryId] = useState(categories[0].id);
  const [generated, setGenerated] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const pathname = usePathname() ?? "/";

  const documents = buildDocumentChecklist(categoryId, categories, coreDocuments, t.certificationSuffix);

  const toggle = (name: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleGenerate = () => {
    setChecked(new Set());
    setGenerated(true);
  };

  return (
    <section className="px-4 pb-20 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <SectionHeading badge={t.badge} title={t.title} subtitle={t.subtitle} />

        <Reveal delay={0.15} className="mt-10">
          <div className="glass-strong rounded-2xl p-6 sm:p-8">
            <label className="mb-2 block text-sm font-medium">{t.categoryLabel}</label>
            <div className="flex flex-wrap gap-3 sm:flex-nowrap">
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setGenerated(false);
                }}
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent sm:max-w-xs"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleGenerate}
                className="brand-gradient flex shrink-0 items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02]"
              >
                <FileCheck2 size={16} />
                {t.generateButton}
              </button>
            </div>

            {generated && (
              <Reveal delay={0} className="mt-6">
                <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                  <div className="flex flex-col divide-y divide-border">
                    {documents.map((doc) => (
                      <button
                        key={doc.name}
                        type="button"
                        onClick={() => toggle(doc.name)}
                        className="flex items-start gap-3 py-4 text-left first:pt-0 last:pb-0"
                      >
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                            checked.has(doc.name) ? "border-accent bg-accent text-white" : "border-border"
                          }`}
                        >
                          {checked.has(doc.name) && <Check size={13} />}
                        </span>
                        <span>
                          <p
                            className={`text-sm font-semibold ${checked.has(doc.name) ? "text-muted line-through" : ""}`}
                          >
                            {doc.name}
                          </p>
                          <p className="mt-0.5 text-sm text-muted">{doc.note}</p>
                        </span>
                      </button>
                    ))}
                  </div>

                  <p className="mt-5 text-xs text-muted">{t.disclaimer}</p>

                  <a
                    href={`/${locale}#consultation`}
                    onClick={() => trackCtaClick("Document Checklist Get Quote", pathname)}
                    className="brand-gradient-animated mt-5 flex w-fit items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02]"
                  >
                    {t.getQuote}
                    <ArrowRight size={16} />
                  </a>
                </div>
              </Reveal>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
