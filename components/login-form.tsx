"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Loader2, LogIn } from "lucide-react";

export function LoginForm() {
  const [form, setForm] = useState({
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });
      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
      };

      if (!response.ok || !payload.ok) {
        setError(payload.message ?? "Could not sign in.");
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Could not sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-white/82">Email</span>
        <input
          value={form.email}
          onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          className="focus-ring mt-2 w-full rounded-2xl border border-white/12 bg-white/8 px-4 py-4 text-base text-white placeholder:text-white/32"
          placeholder="you@example.com"
          type="email"
          autoComplete="email"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-white/82">Password</span>
        <input
          value={form.password}
          onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          className="focus-ring mt-2 w-full rounded-2xl border border-white/12 bg-white/8 px-4 py-4 text-base text-white placeholder:text-white/32"
          placeholder="Your password"
          type="password"
          autoComplete="current-password"
        />
      </label>

      {error ? <p className="rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-white/78">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="focus-ring inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-4 text-sm font-semibold text-ink transition hover:bg-pulse disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
        {loading ? "Signing in" : "Log in"}
        {!loading ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
      </button>
    </form>
  );
}
