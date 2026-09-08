import { requireAdminPage } from "@/lib/adminAuth";
import { getSiteTheme } from "@/lib/actions/theme";
import ThemeSettingsForm from "@/components/admin/ThemeSettingsForm";
import AdminShell from "@/components/admin/AdminShell";
import { PageHeader, Card } from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function ThemeAdminPage() {
  await requireAdminPage();
  const theme = await getSiteTheme();

  return (
    <AdminShell current="/admin/theme">
      <PageHeader
        title="Theme Settings"
        subtitle="Controls the whole public site — brand color, accent color, font, and text size. Saving applies everywhere instantly: headings, buttons, the nav bar, and dropdown menus all read from these same settings."
      />

      <Card className="max-w-2xl">
        <ThemeSettingsForm initial={theme} />
      </Card>
    </AdminShell>
  );
}
