import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdminPage } from "@/lib/adminAuth";
import GlossaryTermForm from "@/components/admin/GlossaryTermForm";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function NewGlossaryTermPage() {
  await requireAdminPage();

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/admin/glossary"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={14} />
          Glossary Terms
        </Link>

        <h1 className="mt-4 font-display text-2xl font-bold text-gray-900">New glossary term</h1>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
          <GlossaryTermForm />
        </div>
      </div>
    </main>
  );
}
