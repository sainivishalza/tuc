import HtmlLangSync from "@/components/HtmlLangSync";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <>
      <HtmlLangSync locale={locale} />
      {/* Marks the public marketing site specifically — scopes the global
          amber focus-visible ring (see globals.css) away from /admin and
          /portal, which keep their own separate focus-ring conventions. */}
      <div className="site-shell">{children}</div>
    </>
  );
}
