"use client";

import { useState, useTransition } from "react";
import { updatePlatformSettings } from "@/lib/actions/sourcingRequests";
import type { PlatformSettingsView, AiProvider } from "@/lib/supabase/types";
import { Card, Button, inputClass, labelClass } from "@/components/admin/ui";

const PROVIDER_HELP: Record<AiProvider, string> = {
  env: "Uses the ANTHROPIC_API_KEY set on your hosting (if any). No key needed here.",
  anthropic: "Translates via Anthropic's API directly, using the key below.",
  openai_compatible:
    "Translates via any OpenRouter-style API — OpenRouter, Together, Groq, or another provider with a free or pay-as-you-go key.",
};

export default function PlatformSettingsCard({ settings }: { settings: PlatformSettingsView }) {
  const [connectMode, setConnectMode] = useState(settings.connect_mode);
  const [monetizationMode, setMonetizationMode] = useState(settings.monetization_mode);
  const [aiProvider, setAiProvider] = useState<AiProvider>(settings.ai_provider);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(settings.ai_model ?? "");
  const [baseUrl, setBaseUrl] = useState(settings.ai_base_url ?? "");
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      await updatePlatformSettings({
        connect_mode: connectMode,
        monetization_mode: monetizationMode,
        ai_provider: aiProvider,
        ai_api_key: apiKey,
        ai_model: model,
        ai_base_url: baseUrl,
      });
      setApiKey("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h3 className="font-admin-display text-sm font-semibold text-gray-900">Marketplace Settings</h3>
        <p className="mt-1 text-xs text-gray-500">Controls how suppliers connect with customers who post a sourcing request.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>How suppliers connect</label>
          <select value={connectMode} onChange={(e) => setConnectMode(e.target.value as typeof connectMode)} className={inputClass}>
            <option value="direct">Direct — supplier contacts customer immediately</option>
            <option value="staff_mediated" disabled>
              Staff-mediated introduction (coming soon)
            </option>
            <option value="platform_chat" disabled>
              In-platform chat, no contact shared (coming soon)
            </option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Monetization</label>
          <select value={monetizationMode} onChange={(e) => setMonetizationMode(e.target.value as typeof monetizationMode)} className={inputClass}>
            <option value="free">Free for everyone</option>
            <option value="supplier_paid" disabled>
              Suppliers pay to respond (coming soon)
            </option>
            <option value="commission" disabled>
              Commission on deals (coming soon)
            </option>
          </select>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <h4 className="font-admin-display text-sm font-semibold text-gray-900">Translation (zh / ru)</h4>
        <p className="mt-1 text-xs text-gray-500">
          New sourcing requests are auto-translated using whichever AI provider you set up here.
        </p>

        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Provider</label>
            <select value={aiProvider} onChange={(e) => setAiProvider(e.target.value as AiProvider)} className={inputClass}>
              <option value="env">Server environment variable</option>
              <option value="anthropic">Anthropic (direct)</option>
              <option value="openai_compatible">OpenRouter / other (OpenAI-compatible)</option>
            </select>
            <p className="mt-1 text-xs text-gray-400">{PROVIDER_HELP[aiProvider]}</p>
          </div>

          {aiProvider !== "env" && (
            <div>
              <label className={labelClass}>API key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={settings.ai_key_preview ? `Saved: ${settings.ai_key_preview} — leave blank to keep it` : "Paste your API key"}
                className={inputClass}
                autoComplete="off"
              />
            </div>
          )}

          {aiProvider === "anthropic" && (
            <div>
              <label className={labelClass}>Model (optional)</label>
              <input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="claude-sonnet-5-5"
                className={inputClass}
              />
            </div>
          )}

          {aiProvider === "openai_compatible" && (
            <>
              <div>
                <label className={labelClass}>Model</label>
                <input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. meta-llama/llama-3.3-70b-instruct:free"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>API base URL (optional)</label>
                <input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://openrouter.ai/api/v1/chat/completions"
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-gray-400">Leave blank to use OpenRouter&apos;s address.</p>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save settings"}
        </Button>
        {saved && <span className="text-xs text-emerald-600">Saved</span>}
      </div>
    </Card>
  );
}
