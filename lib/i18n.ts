export const locales = ["en", "zh", "af", "zu"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  en: "English",
  zh: "中文",
  af: "Afrikaans",
  zu: "isiZulu",
};

const dictionaries = {
  en: () => import("./dictionaries/en.json").then((m) => m.default),
  zh: () => import("./dictionaries/zh.json").then((m) => m.default),
  af: () => import("./dictionaries/af.json").then((m) => m.default),
  zu: () => import("./dictionaries/zu.json").then((m) => m.default),
};

export async function getDictionary(locale: Locale) {
  const loader = dictionaries[locale] ?? dictionaries[defaultLocale];
  return loader();
}

export type Dictionary = Awaited<ReturnType<typeof getDictionary>>;
