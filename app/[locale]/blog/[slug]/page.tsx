import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock, User } from "lucide-react";
import { getDictionary, type Locale } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import LazyContactCTA from "@/components/LazyContactCTA";
import { getPublishedPost, getAllPublishedSlugs } from "@/lib/actions/blogPosts";

export async function generateStaticParams() {
  const slugs = await getAllPublishedSlugs();
  return slugs.map(({ locale, slug }) => ({ locale, slug }));
}

// Fallback safety net — admin publish/edit actions trigger on-demand
// revalidation immediately, this just guards against a missed call.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPublishedPost(locale, slug);
  if (!post) return {};
  return {
    title: `${post.title} — The Unique Choice`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const dict = await getDictionary(locale);
  const post = await getPublishedPost(locale, slug);

  if (!post) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.published_at,
    author: {
      "@type": "Person",
      name: post.author_name,
      jobTitle: post.author_title,
    },
    publisher: {
      "@type": "Organization",
      name: "The Unique Choice",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header dict={dict} locale={locale} />
      <main>
        <section className="relative px-4 pt-28 pb-10 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <Link
              href={`/${locale}/blog`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-foreground"
            >
              <ArrowLeft size={14} />
              {dict.blog.title}
            </Link>

            <h1 className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {post.title}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted">
              <time>{post.published_at}</time>
              {post.read_time && (
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {post.read_time}
                </span>
              )}
              <span className="flex items-center gap-1">
                <User size={14} />
                {post.author_name}
              </span>
            </div>
          </div>
        </section>

        <section className="px-4 pb-6 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="glass-strong rounded-2xl border-l-4 border-accent p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-accent">
                TL;DR
              </p>
              <p className="mt-2 text-sm leading-relaxed sm:text-base">
                {post.summary}
              </p>
            </div>
          </div>
        </section>

        <section className="px-4 py-6 sm:px-6">
          <article className="mx-auto max-w-3xl">
            {post.body.map((block, i) => {
              if (block.type === "heading") {
                return (
                  <h2
                    key={i}
                    className="mt-8 font-display text-xl font-semibold sm:text-2xl"
                  >
                    {block.text}
                  </h2>
                );
              }
              if (block.type === "list") {
                return (
                  <ul key={i} className="mt-4 flex flex-col gap-2 pl-1">
                    {block.items?.map((item) => (
                      <li
                        key={item}
                        className="flex gap-2 text-sm leading-relaxed text-muted sm:text-base"
                      >
                        <span className="text-accent">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                );
              }
              if (block.type === "related") {
                return (
                  <div
                    key={i}
                    className="glass-strong mt-6 rounded-2xl p-5"
                  >
                    <p className="text-xs font-bold uppercase tracking-wider text-accent">
                      {block.heading}
                    </p>
                    <ul className="mt-3 flex flex-col gap-2">
                      {block.items.map((item) => (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className="text-sm font-medium text-foreground underline decoration-accent/40 underline-offset-4 transition hover:text-accent"
                          >
                            {item.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }
              return (
                <p
                  key={i}
                  className="mt-4 text-sm leading-relaxed text-muted sm:text-base"
                >
                  {block.text}
                </p>
              );
            })}
          </article>
        </section>

        <section className="px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="glass-strong flex items-start gap-4 rounded-2xl p-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                <User size={20} />
              </div>
              <div>
                <p className="font-display text-sm font-semibold sm:text-base">
                  {post.author_name}
                </p>
                <p className="text-xs font-medium text-accent sm:text-sm">
                  {post.author_title}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted sm:text-sm">
                  {post.author_bio}
                </p>
              </div>
            </div>
          </div>
        </section>

        <LazyContactCTA dict={dict} />
      </main>
      <Footer dict={dict} locale={locale} />
      <WhatsAppFloat message={dict.contact.whatsappMessage} />
    </>
  );
}
