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
      {children}
    </>
  );
}
