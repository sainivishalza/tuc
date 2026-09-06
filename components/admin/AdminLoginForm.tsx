"use client";

import { useActionState } from "react";
import { Lock } from "lucide-react";
import { login, type LoginState } from "@/app/admin/login/actions";

const initialState: LoginState = {};

export default function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <form action={formAction} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        <div className="gradient-brand flex h-11 w-11 items-center justify-center rounded-xl text-white">
          <Lock size={20} />
        </div>
        <h1 className="mt-4 font-display text-xl font-bold text-gray-900">Admin sign in</h1>
        <p className="mt-1 text-sm text-gray-500">The Unique Choice — internal panel</p>

        <input
          type="password"
          name="password"
          required
          autoFocus
          placeholder="Password"
          className="mt-6 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />

        {state?.error && <p className="mt-3 text-sm text-red-600">{state.error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="gradient-brand mt-4 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-500/25 transition hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
