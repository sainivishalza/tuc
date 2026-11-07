import "server-only";

export interface Translation {
  title_zh: string | null;
  description_zh: string | null;
  title_ru: string | null;
  description_ru: string | null;
  status: "done" | "failed" | "skipped";
}

/** Raw fetch wrapper, no SDK dependency — same reasoning as lib/email.ts's
 * Resend wrapper: one HTTP call doesn't need a package. Degrades to
 * "skipped" (never throws) when ANTHROPIC_API_KEY isn't set, same
 * gracefully-unconfigured pattern as lib/turnstile.ts and the supplier
 * portal's SUPPLIER_SESSION_SECRET check — a sourcing request must still
 * post successfully with English-only text if translation isn't set up. */
export async function translateSourcingRequest(params: {
  title: string;
  description: string;
}): Promise<Translation> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("[translateText] ANTHROPIC_API_KEY not set — sourcing request saved without zh/ru translation.");
    return { title_zh: null, description_zh: null, title_ru: null, description_ru: null, status: "skipped" };
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5-5",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content:
              `Translate the following sourcing-requirement title and description into Simplified Chinese (zh) and Russian (ru). ` +
              `Respond with ONLY a JSON object, no markdown, no explanation, in exactly this shape: ` +
              `{"title_zh":"...","description_zh":"...","title_ru":"...","description_ru":"..."}\n\n` +
              `Title: ${params.title}\n\nDescription: ${params.description}`,
          },
        ],
      }),
      // A hung Anthropic call must never hold up the public submission form.
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => res.statusText);
      console.error(`[translateText] Anthropic API error (${res.status}): ${body}`);
      return { title_zh: null, description_zh: null, title_ru: null, description_ru: null, status: "failed" };
    }

    const data = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = data.content?.find((block) => block.type === "text")?.text ?? "";
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error("[translateText] Anthropic response had no parseable JSON.");
      return { title_zh: null, description_zh: null, title_ru: null, description_ru: null, status: "failed" };
    }

    const parsed = JSON.parse(match[0]) as Record<string, unknown>;
    const asString = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

    return {
      title_zh: asString(parsed.title_zh),
      description_zh: asString(parsed.description_zh),
      title_ru: asString(parsed.title_ru),
      description_ru: asString(parsed.description_ru),
      status: "done",
    };
  } catch (err) {
    console.error("[translateText] translation failed:", err instanceof Error ? err.message : err);
    return { title_zh: null, description_zh: null, title_ru: null, description_ru: null, status: "failed" };
  }
}
