import type { Metadata } from "next";
import { locales, getDictionary, type Locale } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { Clock, ArrowRight } from "lucide-react";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: `${dict.blog.title} — The Unique Choice`,
    description: dict.blog.subtitle,
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return (
    <>
      <Header dict={dict} locale={locale} />
      <main>
        {/* Hero */}
        <section className="relative px-4 pt-28 pb-16 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="brand-gradient mb-4 inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
              {dict.blog.badge}
            </span>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
              {dict.blog.title}
            </h1>
            <p className="mt-5 text-base text-muted sm:text-lg">
              {dict.blog.subtitle}
            </p>
          </div>
        </section>

        {/* Blog Posts */}
        <section className="px-4 pb-20 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="grid grid-cols-1 gap-6">
              {dict.blog.posts.map((post, i) => (
                <article
                  key={post.title}
                  className="glass-strong group flex flex-col gap-4 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:flex-row sm:items-start"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 text-xs text-muted">
                      <time>{post.date}</time>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {post.readTime}
                      </span>
                    </div>
                    <h2 className="mt-3 font-display text-lg font-semibold sm:text-xl">
                      {post.title}
                    </h2>
                    <p className="mt-2 text-sm text-muted sm:text-base">
                      {post.excerpt}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent transition group-hover:gap-2">
                      {dict.blog.readMore}
                      <ArrowRight size={14} />
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
      <WhatsAppFloat message={dict.contact.whatsappMessage} />
    </>
  );
}
