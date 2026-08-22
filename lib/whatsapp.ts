export const WHATSAPP_NUMBER = "919896739100";
export const WHATSAPP_DISPLAY = "+91 98967 39100";

export function whatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
