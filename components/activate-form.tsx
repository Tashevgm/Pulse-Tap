"use client";

import { FormEvent, useMemo, useState } from "react";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";

type FormState = {
  activationCode: string;
  redirectUrl: string;
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

export function ActivateForm() {
  const [form, setForm] = useState<FormState>({
    activationCode: "",
    redirectUrl: ""
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);

  const isValid = useMemo(() => {
    return form.activationCode.trim().length >= 6 && form.redirectUrl.trim().includes(".");
  }, [form]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);

    if (!isValid) {
      setResult({
        ok: false,
        message: "Add a valid activation code and destination URL."
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
        body: JSON.stringify(form)
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
        <p className="text-sm font-semibold">Try demo code</p>
        <p className="mt-1 text-sm text-white/56">Use PULSE-0002 with any destination URL to see a successful activation.</p>
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        <label className="block">
          <span className="text-sm font-medium text-white/82">Activation code</span>
          <input
            value={form.activationCode}
            onChange={(event) => setForm((current) => ({ ...current, activationCode: event.target.value }))}
            className="focus-ring mt-2 w-full rounded-2xl border border-white/12 bg-white/8 px-4 py-4 text-base text-white placeholder:text-white/32"
            placeholder="PULSE-0002"
            autoComplete="off"
          />
        </label>

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
