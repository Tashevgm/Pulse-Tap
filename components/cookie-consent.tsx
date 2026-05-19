"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

type CookieConsentValue = {
  version: 1;
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  savedAt: string;
};

const storageKey = "pulsetap_cookie_consent";

function readConsent() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.localStorage.getItem(storageKey);
    return stored ? (JSON.parse(stored) as CookieConsentValue) : null;
  } catch {
    return null;
  }
}

function saveConsent(consent: Omit<CookieConsentValue, "version" | "necessary" | "savedAt">) {
  const value: CookieConsentValue = {
    version: 1,
    necessary: true,
    ...consent,
    savedAt: new Date().toISOString()
  };

  window.localStorage.setItem(storageKey, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("pulsetap-cookie-consent-changed", { detail: value }));
}

export function CookieConsent() {
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const existing = readConsent();

    if (existing) {
      setAnalytics(existing.analytics);
      setMarketing(existing.marketing);
      setVisible(false);
    } else {
      setVisible(true);
    }

    setReady(true);

    function openSettings() {
      const latest = readConsent();
      setAnalytics(Boolean(latest?.analytics));
      setMarketing(Boolean(latest?.marketing));
      setDetailsOpen(true);
      setVisible(true);
    }

    window.addEventListener("pulsetap-open-cookie-settings", openSettings);
    return () => window.removeEventListener("pulsetap-open-cookie-settings", openSettings);
  }, []);

  function acceptAll() {
    saveConsent({ analytics: true, marketing: true });
    setAnalytics(true);
    setMarketing(true);
    setVisible(false);
  }

  function rejectOptional() {
    saveConsent({ analytics: false, marketing: false });
    setAnalytics(false);
    setMarketing(false);
    setVisible(false);
  }

  function saveChoices() {
    saveConsent({ analytics, marketing });
    setVisible(false);
  }

  if (!ready || !visible) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] px-4 pb-4 sm:px-6">
      <div className="mx-auto max-w-4xl rounded-[1.75rem] border border-white/14 bg-ink/95 p-5 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-pulse">Privacy choices</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">Cookies on PulseTap</h2>
          </div>
          <button
            type="button"
            onClick={rejectOptional}
            className="focus-ring rounded-full border border-white/12 p-2 text-white/70 transition hover:text-white"
            aria-label="Reject optional cookies and close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-4 max-w-3xl text-sm leading-6 text-white/66">
          We use essential cookies and browser storage to run login, activation, checkout and security. Optional
          analytics or marketing cookies are only used if you choose to allow them.
        </p>

        {detailsOpen ? (
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-white">Essential cookies</h3>
                  <p className="mt-1 text-sm leading-6 text-white/60">
                    Required for the website, account access, activation, checkout and consent storage.
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink">Always on</span>
              </div>
            </div>

            <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <span>
                <span className="font-semibold text-white">Analytics cookies</span>
                <span className="mt-1 block text-sm leading-6 text-white/60">
                  Help us understand website usage. PulseTap does not currently load optional analytics cookies.
                </span>
              </span>
              <input
                type="checkbox"
                checked={analytics}
                onChange={(event) => setAnalytics(event.target.checked)}
                className="mt-1 h-5 w-5 accent-cyan-400"
              />
            </label>

            <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
              <span>
                <span className="font-semibold text-white">Marketing cookies</span>
                <span className="mt-1 block text-sm leading-6 text-white/60">
                  Used for advertising or retargeting. PulseTap does not currently load optional marketing cookies.
                </span>
              </span>
              <input
                type="checkbox"
                checked={marketing}
                onChange={(event) => setMarketing(event.target.checked)}
                className="mt-1 h-5 w-5 accent-cyan-400"
              />
            </label>
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/cookies" className="text-sm font-semibold text-white/62 transition hover:text-white">
            Read cookie policy
          </Link>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={rejectOptional}
              className="focus-ring rounded-full border border-white/14 px-4 py-2 text-sm font-semibold text-white/80 transition hover:text-white"
            >
              Reject optional
            </button>
            <button
              type="button"
              onClick={() => setDetailsOpen((current) => !current)}
              className="focus-ring rounded-full border border-white/14 px-4 py-2 text-sm font-semibold text-white/80 transition hover:text-white"
            >
              {detailsOpen ? "Hide choices" : "Manage choices"}
            </button>
            {detailsOpen ? (
              <button
                type="button"
                onClick={saveChoices}
                className="focus-ring rounded-full bg-pulse px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white"
              >
                Save choices
              </button>
            ) : (
              <button
                type="button"
                onClick={acceptAll}
                className="focus-ring rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-pulse"
              >
                Accept all
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("pulsetap-open-cookie-settings"))}
      className="transition hover:text-white"
    >
      Cookie settings
    </button>
  );
}
