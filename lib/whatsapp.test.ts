import { describe, it, expect } from "vitest";
import { whatsappLink, WHATSAPP_NUMBER } from "@/lib/whatsapp";

describe("whatsappLink", () => {
  it("builds a wa.me link with the fixed WhatsApp number", () => {
    expect(whatsappLink("hi")).toBe(`https://wa.me/${WHATSAPP_NUMBER}?text=hi`);
  });

  it("URL-encodes the message, including reserved characters", () => {
    const link = whatsappLink("Hi! Is this in stock? 50% off?");
    expect(link).toBe(`https://wa.me/${WHATSAPP_NUMBER}?text=Hi!%20Is%20this%20in%20stock%3F%2050%25%20off%3F`);
  });

  it("round-trips through decodeURIComponent", () => {
    const message = 'Quote for "Model A" — qty: 500';
    const link = whatsappLink(message);
    const query = new URL(link).searchParams.get("text");
    expect(query).toBe(message);
  });
});
