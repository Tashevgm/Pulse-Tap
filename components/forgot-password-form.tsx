"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Loader2, Mail } from "lucide-react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email })
      });
      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
      };

      if (!response.ok || !payload.ok) {
        setError(payload.message ?? "Could not send a password reset email.");
        return;
      }

      setSuccess(payload.message ?? "Check your email for the reset link.");
    } catch {
      setError("Could not send a password reset email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-white/82">Email</span>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="focus-ring mt-2 w-full rounded-2xl border border-white/12 bg-white/8 px-4 py-4 text-base text-white placeholder:text-white/32"
          placeholder="you@example.com"
          type="email"
          autoComplete="email"
        />
      </label>

      {error ? <p className="rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-white/78">{error}</p> : null}
      {success ? (
        <div className="rounded-2xl border border-volt/30 bg-volt/10 px-4 py-3 text-sm text-white/78">
          <div className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-volt" />
            <p>{success}</p>
          </div>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="focus-ring inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-4 text-sm font-semibold text-ink transition hover:bg-pulse disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
        {loading ? "Sending reset link" : "Send reset link"}
      </button>
    </form>
  );
}
