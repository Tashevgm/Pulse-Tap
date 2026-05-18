"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, TriangleAlert } from "lucide-react";

type FormState = {
  activationCode: string;
  redirectUrl: string;
  name: string;
  email: string;
  password: string;
};

type ApiResponse = {
  ok: boolean;
  message: string;
  card?: {
    id: string;
    redirectUrl: string;
    type: string;
  };
};

type ActivateFormProps = {
  claimToken?: string;
  initialRedirectUrl?: string;
  isSignedIn?: boolean;
  detectedCard?: {
    id: string;
    label: string;
    database: string;
    activated: boolean;
  } | null;
};

export function ActivateForm({
  claimToken = "",
  initialRedirectUrl = "",
  isSignedIn = false,
  detectedCard = null
}: ActivateFormProps) {
  const [form, setForm] = useState<FormState>({
    activationCode: "",
    redirectUrl: initialRedirectUrl,
    name: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);

  const isValid = useMemo(() => {
    return (claimToken || form.activationCode.trim().length >= 6) && form.redirectUrl.trim().includes(".");
  }, [claimToken, form]);

  const googleNext = useMemo(() => {
    const params = new URLSearchParams();

    if (claimToken) {
      params.set("claim", claimToken);
    }

    if (form.redirectUrl.trim()) {
      params.set("destination", form.redirectUrl.trim());
    }

    const next = `/activate${params.toString() ? `?${params.toString()}` : ""}`;
    return `/api/auth/google?next=${encodeURIComponent(next)}`;
  }, [claimToken, form.redirectUrl]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);

    if (!isValid) {
      setResult({
        ok: false,
        message: "Add a valid destination URL."
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          activationCode: form.activationCode,
          redirectUrl: form.redirectUrl,
          claimToken,
          account: {
            name: form.name,
            email: form.email,
            password: form.password
          }
        })
      });
      const payload = (await response.json()) as ApiResponse;
      setResult(payload);
    } catch {
      setResult({
        ok: false,
        message: "Activation could not be completed. Check your connection and try again."
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass rounded-[2rem] p-5 md:p-8">
      <div className="rounded-3xl border border-white/10 bg-black/24 p-4">
        <p className="text-sm font-semibold">{detectedCard ? "Card detected" : "Try demo claim link"}</p>
        <p className="mt-1 text-sm text-white/56">
          {detectedCard
            ? `${detectedCard.label} (${detectedCard.id}) is ready for activation.`
            : "Open /activate?claim=google-claim-002-ptg to test automatic card detection."}
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        {!claimToken ? (
          <label className="block">
            <span className="text-sm font-medium text-white/82">Activation code</span>
            <input
              value={form.activationCode}
              onChange={(event) => setForm((current) => ({ ...current, activationCode: event.target.value }))}
              className="focus-ring mt-2 w-full rounded-2xl border border-white/12 bg-white/8 px-4 py-4 text-base text-white placeholder:text-white/32"
              placeholder="GOOGLE-002"
              autoComplete="off"
            />
          </label>
        ) : null}

        <label className="block">
          <span className="text-sm font-medium text-white/82">Destination URL</span>
          <input
            value={form.redirectUrl}
            onChange={(event) => setForm((current) => ({ ...current, redirectUrl: event.target.value }))}
            className="focus-ring mt-2 w-full rounded-2xl border border-white/12 bg-white/8 px-4 py-4 text-base text-white placeholder:text-white/32"
            placeholder="https://your-website.com"
            inputMode="url"
          />
        </label>

        {isSignedIn ? (
          <div className="rounded-3xl border border-volt/25 bg-volt/10 p-4">
            <p className="text-sm font-semibold text-white/84">Signed in</p>
            <p className="mt-1 text-sm leading-6 text-white/56">
              This product will be connected to your PulseTap profile after activation.
            </p>
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/[0.055] p-4">
            <p className="text-sm font-semibold text-white/84">Create your management account</p>
            <p className="mt-1 text-sm leading-6 text-white/56">
              This keeps the card connected to you so you can edit the link later.
            </p>

            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-white/82">Full name</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="focus-ring mt-2 w-full rounded-2xl border border-white/12 bg-white/8 px-4 py-4 text-base text-white placeholder:text-white/32"
                  placeholder="Your name"
                  autoComplete="name"
                />
              </label>

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
                  placeholder="At least 8 characters"
                  type="password"
                  autoComplete="new-password"
                />
              </label>
            </div>

            <Link
              href={googleNext}
              className="focus-ring mt-4 flex w-full items-center justify-center gap-3 rounded-full border border-white/14 bg-white/8 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/14"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white text-base font-bold text-ink">G</span>
              Continue with Google
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="focus-ring inline-flex w-full items-center justify-center rounded-full bg-white px-5 py-4 text-sm font-semibold text-ink transition hover:bg-pulse disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Activating
            </>
          ) : (
            "Activate Card"
          )}
        </button>
      </form>

      {result ? (
        <div className={`mt-5 rounded-3xl border p-4 ${result.ok ? "border-volt/30 bg-volt/10" : "border-coral/35 bg-coral/10"}`}>
          <div className="flex gap-3">
            {result.ok ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-volt" /> : <TriangleAlert className="mt-0.5 h-5 w-5 text-coral" />}
            <div>
              <p className="font-semibold">{result.ok ? "Activated" : "Needs attention"}</p>
              <p className="mt-1 text-sm leading-6 text-white/66">{result.message}</p>
              {result.card ? (
                <a className="mt-3 inline-flex text-sm font-semibold text-pulse" href={`/api/redirect?id=${result.card.id}`} target="_blank" rel="noreferrer">
                  Test redirect for {result.card.id}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
