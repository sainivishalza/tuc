"use client";

import { useEffect } from "react";

// The root layout renders <html> above the [locale] segment, so it has
// no access to the locale without reading a dynamic API (headers/cookies)
// — which would force every page to render dynamically and break the
// static generation this site relies on. Syncing the attribute here
// instead keeps every page statically generated.
export default function HtmlLangSync({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}
