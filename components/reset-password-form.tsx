"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, LockKeyhole } from "lucide-react";

export function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password })
      });
      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
      };

      if (!response.ok || !payload.ok) {
        setError(payload.message ?? "Could not update your password.");
        return;
      }

      setSuccess(payload.message ?? "Password updated.");
    } catch {
      setError("Could not update your password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-sm font-medium text-white/82">New password</span>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="focus-ring mt-2 w-full rounded-2xl border border-white/12 bg-white/8 px-4 py-4 text-base text-white placeholder:text-white/32"
          placeholder="At least 8 characters"
          type="password"
          autoComplete="new-password"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-white/82">Confirm password</span>
        <input
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="focus-ring mt-2 w-full rounded-2xl border border-white/12 bg-white/8 px-4 py-4 text-base text-white placeholder:text-white/32"
          placeholder="Repeat new password"
          type="password"
          autoComplete="new-password"
        />
      </label>

      {error ? <p className="rounded-2xl border border-coral/30 bg-coral/10 px-4 py-3 text-sm text-white/78">{error}</p> : null}
      {success ? (
        <div className="rounded-2xl border border-volt/30 bg-volt/10 px-4 py-3 text-sm text-white/78">
          <div className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-volt" />
            <div>
              <p>{success}</p>
              <Link href="/dashboard" className="mt-2 inline-flex items-center font-semibold text-pulse">
                Open profile
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="focus-ring inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-4 text-sm font-semibold text-ink transition hover:bg-pulse disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LockKeyhole className="mr-2 h-4 w-4" />}
        {loading ? "Updating password" : "Update password"}
      </button>
    </form>
  );
}
