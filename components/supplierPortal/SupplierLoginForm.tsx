"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight } from "lucide-react";
import { requestSupplierLoginLink, type RequestLinkState } from "@/lib/actions/supplierPortal";
import TurnstileWidget from "@/components/TurnstileWidget";

const initialState: RequestLinkState = {};

export default function SupplierLoginForm() {
  const [state, formAction, pending] = useActionState(requestSupplierLoginLink, initialState);
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
          <h1 className="font-display mt-4 text-xl font-semibold">Supplier Login</h1>
          <p className="mt-2 text-sm text-muted">
            Enter your account email and we&apos;ll send you a sign-in link — no password needed.
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
                className="btn-primary w-full"
              >
                {pending ? "Sending..." : "Send sign-in link"}
                {!pending && <ArrowRight size={16} />}
              </button>
            </form>
          )}

          {state?.notRegistered && (
            <Link href="/en/suppliers/register" className="btn-primary mt-4 w-full">
              Apply as a Supplier
              <ArrowRight size={16} />
            </Link>
          )}
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Not registered yet?{" "}
          <Link href="/en/suppliers/register" className="font-medium text-accent hover:underline">
            Apply as a supplier
          </Link>
        </p>
      </div>
    </main>
  );
}
