import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import type { AiProvider } from "@/lib/supabase/types";

export interface Translation {
  title_zh: string | null;
  description_zh: string | null;
  title_ru: string | null;
  description_ru: string | null;
  status: "done" | "failed" | "skipped";
}

interface ProviderConfig {
  provider: AiProvider;
  apiKey: string | null;
  model: string | null;
  baseUrl: string | null;
}

/** Internal server-to-server read — deliberately bypasses requireAdminAction
 * (that gate is for human admin-panel actions; this is plumbing inside the
 * public submit flow, which has no admin session). RLS still restricts this
 * table to the service-role client either way. */
async function getProviderConfig(): Promise<ProviderConfig> {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("platform_settings")
    .select("ai_provider, ai_api_key, ai_model, ai_base_url")
    .eq("id", "default")
    .maybeSingle();

  return {
    provider: (data?.ai_provider as AiProvider) ?? "env",
    apiKey: data?.ai_api_key ?? null,
    model: data?.ai_model ?? null,
    baseUrl: data?.ai_base_url ?? null,
  };
}

function buildPrompt(title: string, description: string): string {
  return (
    `Translate the following sourcing-requirement title and description into Simplified Chinese (zh) and Russian (ru). ` +
    `Respond with ONLY a JSON object, no markdown, no explanation, in exactly this shape: ` +
    `{"title_zh":"...","description_zh":"...","title_ru":"...","description_ru":"..."}\n\n` +
    `Title: ${title}\n\nDescription: ${description}`
  );
}

function parseTranslationJson(text: string): Translation {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    console.error("[translateText] model response had no parseable JSON.");
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
}

const FAILED: Translation = { title_zh: null, description_zh: null, title_ru: null, description_ru: null, status: "failed" };
const SKIPPED: Translation = { title_zh: null, description_zh: null, title_ru: null, description_ru: null, status: "skipped" };

/** Anthropic Messages API — used for both the legacy env-var path and the
 * admin-configured "anthropic" provider, since they're the same request shape. */
async function translateViaAnthropic(apiKey: string, model: string, prompt: string): Promise<Translation> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    }),
    // A hung provider call must never hold up the public submission form.
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    console.error(`[translateText] Anthropic API error (${res.status}): ${body}`);
    return FAILED;
  }

  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = data.content?.find((block) => block.type === "text")?.text ?? "";
  return parseTranslationJson(text);
}

/** OpenAI-compatible chat-completions shape — covers OpenRouter and the many
 * other "free API key" aggregators (Together, Groq, Fireworks, etc.) that
 * all mirror the same request/response format, so one branch handles all
 * of them via the admin-configured base URL + model. */
async function translateViaOpenAiCompatible(
  apiKey: string,
  model: string,
  baseUrl: string,
  prompt: string
): Promise<Translation> {
  const res = await fetch(baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    console.error(`[translateText] OpenAI-compatible API error (${res.status}): ${body}`);
    return FAILED;
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = data.choices?.[0]?.message?.content ?? "";
  return parseTranslationJson(text);
}

/** Degrades to "skipped" (never throws) whenever translation isn't
 * configured — a sourcing request must still post successfully with
 * English-only text either way. Reads provider config from
 * platform_settings (admin-configurable), falling back to the legacy
 * ANTHROPIC_API_KEY env var ("env" provider, the default) for anyone who
 * set that up before this settings UI existed. */
export async function translateSourcingRequest(params: {
  title: string;
  description: string;
}): Promise<Translation> {
  const config = await getProviderConfig();
  const prompt = buildPrompt(params.title, params.description);

  try {
    if (config.provider === "anthropic" && config.apiKey) {
      return await translateViaAnthropic(config.apiKey, config.model || "claude-sonnet-5-5", prompt);
    }

    if (config.provider === "openai_compatible" && config.apiKey && config.model) {
      const baseUrl = config.baseUrl || "https://openrouter.ai/api/v1/chat/completions";
      return await translateViaOpenAiCompatible(config.apiKey, config.model, baseUrl, prompt);
    }

    // "env" provider, or an openai_compatible config missing its required
    // model/key — fall back to the original env-var-only behavior.
    const envKey = process.env.ANTHROPIC_API_KEY;
    if (!envKey) {
      console.error(
        "[translateText] No AI provider configured (set one in /admin/sourcing-requests settings, or ANTHROPIC_API_KEY) — sourcing request saved without zh/ru translation."
      );
      return SKIPPED;
    }
    return await translateViaAnthropic(envKey, "claude-sonnet-5-5", prompt);
  } catch (err) {
    console.error("[translateText] translation failed:", err instanceof Error ? err.message : err);
    return FAILED;
  }
}
