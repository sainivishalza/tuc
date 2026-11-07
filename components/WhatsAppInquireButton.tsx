"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { whatsappLink } from "@/lib/whatsapp";
import { trackInquiry } from "@/lib/analytics";

/** The one WhatsApp CTA on a product or supplier detail page that should
 * actually record who was interested in what (lib/analytics.ts's
 * trackInquiry) — distinct from the generic floating WhatsAppFloat
 * button, which stays untracked-by-entity since it's not about any one
 * product/supplier. */
export default function WhatsAppInquireButton({
  message,
  label,
  entityType,
  entityId,
  supplierId,
  supplierCompanyName,
  productTitle,
}: {
  message: string;
  label: string;
  entityType: "product" | "supplier";
  entityId: string;
  supplierId: string;
  supplierCompanyName: string;
  productTitle?: string;
}) {
  const pathname = usePathname() ?? "/";

  return (
    <a
      href={whatsappLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        trackInquiry({
          entityType,
          entityId,
          supplierId,
          supplierCompanyName,
          productTitle,
          path: pathname,
        })
      }
      className="btn-primary"
    >
      <MessageCircle size={16} />
      {label}
    </a>
  );
}
