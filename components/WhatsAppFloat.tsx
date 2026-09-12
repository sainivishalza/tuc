"use client";

import { MessageCircle } from "lucide-react";
import { whatsappLink } from "@/lib/whatsapp";
import { trackCtaClick } from "@/lib/analytics";
import { usePathname } from "next/navigation";

export default function WhatsAppFloat({ message }: { message: string }) {
  const pathname = usePathname() ?? "/";

  return (
    <a
      href={whatsappLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      onClick={() => trackCtaClick("WhatsApp Float", pathname)}
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-brand-navy text-white shadow-lg shadow-black/20 transition hover:scale-105 active:scale-95 sm:bottom-7 sm:right-7"
    >
      <MessageCircle size={24} strokeWidth={1.8} />
      <span className="absolute right-0.5 top-0.5 h-3.5 w-3.5 rounded-full border-2 border-brand-navy bg-[#25D366]" />
    </a>
  );
}
