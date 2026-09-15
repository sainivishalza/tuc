"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { UserPlus, ArrowRight } from "lucide-react";
import { registerClient, type RegisterState } from "@/lib/actions/portal";
import TurnstileWidget from "@/components/TurnstileWidget";

const initialState: RegisterState = {};

export default function PortalRegisterForm() {
  const [state, formAction, pending] = useActionState(registerClient, initialState);
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
            <UserPlus size={20} />
          </div>
          <h1 className="font-display mt-4 text-xl font-semibold">Create Your Account</h1>
          <p className="mt-2 text-sm text-muted">
            Register once, then sign in anytime with just your email — no password needed.
          </p>

          {state?.message ? (
            <p className="mt-6 rounded-lg bg-accent/10 px-4 py-3 text-sm text-accent">{state.message}</p>
          ) : (
            <form action={formAction} className="mt-6 space-y-4 text-left">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">Full name</label>
                <input
                  type="text"
                  name="name"
                  required
                  autoFocus
                  placeholder="Jane Smith"
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@company.com"
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">Company (optional)</label>
                <input
                  type="text"
                  name="company"
                  placeholder="Acme Inc."
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted">Phone (optional)</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+1 555 123 4567"
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <input type="hidden" name="turnstileToken" value={turnstileToken} />
              <TurnstileWidget onVerify={setTurnstileToken} />
              {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
              <button
                type="submit"
                disabled={pending || (captchaConfigured && !turnstileToken)}
                className="btn-primary w-full"
              >
                {pending ? "Creating account..." : "Create account"}
                {!pending && <ArrowRight size={16} />}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account?{" "}
          <Link href="/portal/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
