import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdminPage } from "@/lib/adminAuth";
import { getSiteTheme } from "@/lib/actions/theme";
import ThemeSettingsForm from "@/components/admin/ThemeSettingsForm";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function ThemeAdminPage() {
  await requireAdminPage();
  const theme = await getSiteTheme();

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={14} />
          Admin
        </Link>

        <h1 className="mt-4 font-display text-2xl font-bold text-gray-900">Theme Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Controls the whole public site — brand color, accent color, font, and text size. Saving
          applies everywhere instantly: headings, buttons, the nav bar, and dropdown menus all
          read from these same settings.
        </p>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
          <ThemeSettingsForm initial={theme} />
        </div>
      </div>
    </main>
  );
}
