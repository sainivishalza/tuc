const SEARCH_ENGINE_HOSTS = ["google.", "bing.", "yahoo.", "duckduckgo.", "yandex.", "baidu.", "ecosia.org"];
const SOCIAL_HOSTS = [
  "facebook.com", "instagram.com", "twitter.com", "x.com", "linkedin.com",
  "pinterest.", "tiktok.com", "reddit.com", "whatsapp.com", "t.me", "telegram.org", "youtube.com",
];

/** Classifies a session's traffic source from its captured referrer/UTM params. */
export function classifySource(referrer: string | null, utmSource: string | null): string {
  if (utmSource) return `Campaign: ${utmSource}`;
  if (!referrer) return "Direct";

  let host = "";
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return "Direct";
  }

  if (SEARCH_ENGINE_HOSTS.some((h) => host.includes(h))) return "Organic Search";
  if (SOCIAL_HOSTS.some((h) => host.includes(h))) return "Social";
  return `Referral: ${host.replace(/^www\./, "")}`;
}
