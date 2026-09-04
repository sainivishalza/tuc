import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n";
import { whatsappLink } from "@/lib/whatsapp";

export default function Footer({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="border-b border-gray-800 px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <h3 className="font-display text-base font-semibold text-white">
              {dict.footer.tagline}
            </h3>
            <p className="mt-1 text-sm text-gray-400">{dict.nav.chatWhatsapp}</p>
          </div>
          <a
            href={whatsappLink(dict.contact.whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="gradient-brand flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/25 transition hover:scale-105"
          >
            <MessageCircle size={16} />
            {dict.nav.chatWhatsapp}
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-[1.3fr_1fr_1fr]">
          <div className="max-w-sm">
            <Link href={`/${locale}`} className="flex items-center gap-2.5">
              <span className="gradient-brand flex h-8 w-8 items-center justify-center rounded-lg font-display text-sm font-semibold text-white">
                U
              </span>
              <span className="font-display text-base font-semibold text-white">
                <span className="text-emerald-400">The Unique</span> Choice
              </span>
            </Link>
            <p className="mt-3 text-sm text-gray-400">{dict.footer.tagline}</p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              {dict.footer.servicesLabel}
            </h4>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-gray-300">
              {dict.services.items.slice(0, 5).map((s) => (
                <li key={s.title}>{s.title}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              {dict.footer.companyLabel}
            </h4>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-gray-300">
              <li>
                <Link href={`/${locale}/about`} className="hover:text-white">
                  {dict.nav.about}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/contact`} className="hover:text-white">
                  {dict.nav.contactPage}
                </Link>
              </li>
              <li>
                <a href="#services" className="hover:text-white">
                  {dict.nav.services}
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-white">
                  {dict.nav.faq}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-6xl text-xs text-gray-500">
          © {year} The Unique Choice. {dict.footer.rights}
        </div>
      </div>
    </footer>
  );
}
