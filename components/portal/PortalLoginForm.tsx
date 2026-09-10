"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight } from "lucide-react";
import { requestPortalLink, type RequestLinkState } from "@/lib/actions/portal";
import TurnstileWidget from "@/components/TurnstileWidget";

const initialState: RequestLinkState = {};

export default function PortalLoginForm() {
  const [state, formAction, pending] = useActionState(requestPortalLink, initialState);
  const [turnstileToken, setTurnstileToken] = useState("");
  const captchaConfigured = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2.5">
          <span className="brand-gradient flex h-9 w-9 items-center justify-center rounded-lg font-display text-base font-semibold text-white">
            U
          </span>
          <span className="font-display text-base font-semibold tracking-tight">
            <span className="text-accent">The Unique</span> Choice
          </span>
        </Link>

        <div className="glass-strong rounded-2xl p-8 text-center">
          <div className="brand-gradient mx-auto flex h-11 w-11 items-center justify-center rounded-xl text-white">
            <Mail size={20} />
          </div>
          <h1 className="font-display mt-4 text-xl font-semibold">Client Portal</h1>
          <p className="mt-2 text-sm text-muted">
            Enter the email on file with your orders and we&apos;ll send you a sign-in link — no password needed.
          </p>

          {state?.message ? (
            <p className="mt-6 rounded-lg bg-accent/10 px-4 py-3 text-sm text-accent">{state.message}</p>
          ) : (
            <form action={formAction} className="mt-6 space-y-4 text-left">
              <input
                type="email"
                name="email"
                required
                autoFocus
                placeholder="you@company.com"
                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <input type="hidden" name="turnstileToken" value={turnstileToken} />
              <TurnstileWidget onVerify={setTurnstileToken} />
              {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
              <button
                type="submit"
                disabled={pending || (captchaConfigured && !turnstileToken)}
                className="brand-gradient flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-md shadow-accent/20 transition hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
              >
                {pending ? "Sending..." : "Send sign-in link"}
                {!pending && <ArrowRight size={16} />}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
