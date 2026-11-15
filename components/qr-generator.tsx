"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { Download, ExternalLink, Link2, Loader2, Pencil, Plus, Save, Trash2 } from "lucide-react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import type { DynamicQrCode } from "@/lib/dynamic-qr";

type ClientDynamicQrCode = DynamicQrCode & { publicUrl: string };
type QrMode = "static" | "dynamic";
type StaticType = "url" | "text" | "email" | "phone";
type CorrectionLevel = "L" | "M" | "Q" | "H";

const staticTypes: Array<{ id: StaticType; label: string; placeholder: string }> = [
  { id: "url", label: "Website", placeholder: "https://www.pulse-tap.com" },
  { id: "text", label: "Text", placeholder: "Enter any message" },
  { id: "email", label: "Email", placeholder: "hello@example.com" },
  { id: "phone", label: "Phone", placeholder: "+44 20 0000 0000" }
];

function staticPayload(type: StaticType, value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (type === "email") return `mailto:${trimmed.replace(/^mailto:/i, "")}`;
  if (type === "phone") return `tel:${trimmed.replace(/^tel:/i, "").replace(/\s+/g, "")}`;
  if (type === "url") return /^[a-z][a-z\d+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return value;
}

function safeFilename(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "pulsetap-qr-code"
  );
}

export function QrGenerator({
  isAuthenticated,
  initialCodes,
  databaseReady,
  initialMode = "static",
  initialSelectedId
}: {
  isAuthenticated: boolean;
  initialCodes: ClientDynamicQrCode[];
  databaseReady: boolean;
  initialMode?: QrMode;
  initialSelectedId?: string;
}) {
  const initialCode = initialSelectedId ? initialCodes.find((code) => code.id === initialSelectedId) : undefined;
  const [mode, setMode] = useState<QrMode>(initialMode);
  const [staticType, setStaticType] = useState<StaticType>("url");
  const [staticValue, setStaticValue] = useState("");
  const [codes, setCodes] = useState(initialCodes);
  const [selectedId, setSelectedId] = useState(initialCode?.id ?? "");
  const [dynamicName, setDynamicName] = useState(initialCode?.name ?? "");
  const [dynamicDestination, setDynamicDestination] = useState(initialCode?.destinationUrl ?? "");
  const [editing, setEditing] = useState(Boolean(initialCode));
  const [foreground, setForeground] = useState("#07080d");
  const [background, setBackground] = useState("#ffffff");
  const [transparent, setTransparent] = useState(false);
  const [size, setSize] = useState(1024);
  const [level, setLevel] = useState<CorrectionLevel>("M");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedCode = codes.find((code) => code.id === selectedId);
  const value = mode === "static" ? staticPayload(staticType, staticValue) : selectedCode?.publicUrl ?? "";
  const filename = safeFilename(mode === "dynamic" && selectedCode ? selectedCode.name : `pulsetap-${staticType}-qr`);
  const activeStaticType = staticTypes.find((type) => type.id === staticType) ?? staticTypes[0];

  const previewDescription = useMemo(() => {
    if (!value) return "Enter content to generate your QR code.";
    if (mode === "dynamic" && selectedCode) return `${selectedCode.name} - ${selectedCode.scans} scans`;
    return "Static QR code ready to download.";
  }, [mode, selectedCode, value]);

  function selectDynamicCode(code: ClientDynamicQrCode) {
    setSelectedId(code.id);
    setDynamicName(code.name);
    setDynamicDestination(code.destinationUrl);
    setEditing(true);
    setError("");
    setMessage("");
  }

  function startNewDynamicCode() {
    setSelectedId("");
    setDynamicName("");
    setDynamicDestination("");
    setEditing(false);
    setError("");
    setMessage("");
  }

  async function saveDynamicCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(editing && selectedId ? `/api/qr/${selectedId}` : "/api/qr", {
        method: editing && selectedId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: dynamicName, destinationUrl: dynamicDestination })
      });
      const payload = (await response.json()) as { ok: boolean; message?: string; code?: ClientDynamicQrCode };

      if (!response.ok || !payload.ok || !payload.code) {
        setError(payload.message ?? "Could not save this dynamic QR code.");
        return;
      }

      const savedCode = payload.code;
      setCodes((current) => {
        const exists = current.some((code) => code.id === savedCode.id);
        return exists ? current.map((code) => (code.id === savedCode.id ? savedCode : code)) : [savedCode, ...current];
      });
      setSelectedId(savedCode.id);
      setDynamicName(savedCode.name);
      setDynamicDestination(savedCode.destinationUrl);
      setEditing(true);
      setMessage(editing ? "Dynamic QR code updated." : "Dynamic QR code created.");
    } catch {
      setError("Could not save this dynamic QR code.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteSelectedCode() {
    if (!selectedCode || !window.confirm(`Delete ${selectedCode.name}? Its printed QR code will stop working.`)) return;
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/qr/${selectedCode.id}`, { method: "DELETE" });
      const payload = (await response.json()) as { ok: boolean; message?: string };
      if (!response.ok || !payload.ok) {
        setError(payload.message ?? "Could not delete this QR code.");
        return;
      }
      setCodes((current) => current.filter((code) => code.id !== selectedCode.id));
      startNewDynamicCode();
      setMessage("Dynamic QR code deleted.");
    } catch {
      setError("Could not delete this QR code.");
    } finally {
      setLoading(false);
    }
  }

  function downloadPng() {
    const canvas = document.getElementById("pulsetap-qr-canvas") as HTMLCanvasElement | null;
    if (!canvas || !value) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${filename}.png`;
    link.click();
  }

  function downloadSvg() {
    const svg = document.querySelector("#pulsetap-qr-svg svg");
    if (!svg || !value) return;
    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>${source}`], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 border-y border-white/10">
        {(["static", "dynamic"] as QrMode[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setMode(item);
              setError("");
              setMessage("");
            }}
            className={`focus-ring flex min-h-16 items-center justify-between px-4 text-left text-sm font-semibold capitalize transition sm:px-6 ${
              mode === item ? "bg-white text-ink" : "bg-white/[0.035] text-white/62 hover:bg-white/[0.07] hover:text-white"
            }`}
          >
            <span>{item} QR</span>
            <span className={`text-xs ${mode === item ? "text-ink/52" : "text-pulse"}`}>
              {item === "static" ? "No account" : "Editable"}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="border border-white/12 bg-white/[0.045] p-4 sm:p-6">
          {mode === "static" ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-pulse">Always free</p>
                  <h2 className="mt-2 text-2xl font-semibold">Static QR content</h2>
                </div>
                <span className="border border-volt/25 bg-volt/10 px-3 py-2 text-xs font-semibold text-volt">No expiry</span>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-1 border border-white/10 bg-black/20 p-1 sm:grid-cols-4">
                {staticTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setStaticType(type.id)}
                    className={`focus-ring min-h-10 px-3 text-xs font-semibold transition ${
                      staticType === type.id ? "bg-white text-ink" : "text-white/54 hover:bg-white/8 hover:text-white"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
              <label className="mt-5 block">
                <span className="text-sm font-medium text-white/78">{activeStaticType.label} content</span>
                <textarea
                  value={staticValue}
                  onChange={(event) => setStaticValue(event.target.value)}
                  rows={7}
                  placeholder={activeStaticType.placeholder}
                  className="focus-ring mt-2 w-full resize-y border border-white/12 bg-black/24 px-4 py-3 text-sm leading-6 text-white placeholder:text-white/28"
                />
              </label>
              <p className="mt-3 text-xs leading-5 text-white/42">
                Static QR codes store the destination inside the image. They work forever, but the destination cannot be changed after printing.
              </p>
            </>
          ) : !isAuthenticated ? (
            <div className="py-8">
              <p className="text-xs font-semibold uppercase text-pulse">Free account required</p>
              <h2 className="mt-3 text-3xl font-semibold">Keep the QR. Change the link.</h2>
              <p className="mt-4 max-w-lg text-sm leading-7 text-white/58">
                Dynamic QR codes point to a permanent PulseTap short link. Your account stores the editable destination and scan count at no charge.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link href="/signup?next=%2Ftools%2Fqr" className="focus-ring inline-flex items-center justify-center bg-white px-5 py-3 text-sm font-semibold text-ink hover:bg-pulse">
                  Create free account
                </Link>
                <Link href="/login?next=%2Ftools%2Fqr" className="focus-ring inline-flex items-center justify-center border border-white/14 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
                  Log in
                </Link>
              </div>
            </div>
          ) : !databaseReady ? (
            <div className="border border-coral/25 bg-coral/10 p-5 text-sm leading-6 text-white/72">
              Dynamic QR storage is not ready yet. Apply <code>supabase/dynamic-qr-migration.sql</code> to the PulseTap Supabase project.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-pulse">Free and editable</p>
                  <h2 className="mt-2 text-2xl font-semibold">Dynamic QR link</h2>
                </div>
                <button type="button" onClick={startNewDynamicCode} className="focus-ring inline-flex h-10 w-10 items-center justify-center border border-white/14 bg-white/5 text-white hover:bg-white/10" title="Create new QR code">
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {codes.length > 0 ? (
                <div className="mt-5 max-h-48 overflow-y-auto border-y border-white/10">
                  {codes.map((code) => (
                    <button
                      key={code.id}
                      type="button"
                      onClick={() => selectDynamicCode(code)}
                      className={`flex w-full items-center justify-between gap-4 border-b border-white/8 px-3 py-3 text-left transition last:border-b-0 ${selectedId === code.id ? "bg-pulse/10" : "hover:bg-white/5"}`}
                    >
                      <span className="min-w-0">
                        <strong className="block truncate text-sm text-white">{code.name}</strong>
                        <small className="mt-1 block truncate text-xs text-white/40">{code.publicUrl}</small>
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-volt">{code.scans} scans</span>
                    </button>
                  ))}
                </div>
              ) : null}

              <form onSubmit={saveDynamicCode} className="mt-5 space-y-4">
                <label className="block">
                  <span className="text-sm font-medium text-white/78">QR name</span>
                  <input value={dynamicName} onChange={(event) => setDynamicName(event.target.value)} maxLength={80} placeholder="e.g. Shop Google Reviews or Restaurant Menu" aria-describedby="dynamic-qr-name-help" className="focus-ring mt-2 h-12 w-full border border-white/12 bg-black/24 px-4 text-sm text-white placeholder:text-white/28" />
                  <span id="dynamic-qr-name-help" className="mt-2 block text-xs leading-5 text-white/42">Choose a name to help you identify this QR code. The destination URL determines where it takes people.</span>
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-white/78">Destination URL</span>
                  <input value={dynamicDestination} onChange={(event) => setDynamicDestination(event.target.value)} placeholder="https://example.com" className="focus-ring mt-2 h-12 w-full border border-white/12 bg-black/24 px-4 text-sm text-white placeholder:text-white/28" />
                </label>
                {selectedCode ? (
                  <a href={selectedCode.publicUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs text-pulse hover:text-white">
                    {selectedCode.publicUrl}<ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                  </a>
                ) : null}
                {error ? <p className="border border-coral/25 bg-coral/10 px-3 py-2 text-xs text-white/74">{error}</p> : null}
                {message ? <p className="border border-volt/25 bg-volt/10 px-3 py-2 text-xs text-white/74">{message}</p> : null}
                <div className="flex flex-wrap gap-2">
                  <button disabled={loading} type="submit" className="focus-ring inline-flex items-center bg-white px-4 py-3 text-sm font-semibold text-ink hover:bg-pulse disabled:opacity-50">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : editing ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                    {editing ? "Save changes" : "Create dynamic QR"}
                  </button>
                  {selectedCode ? (
                    <button disabled={loading} type="button" onClick={deleteSelectedCode} className="focus-ring inline-flex items-center border border-coral/30 bg-coral/10 px-4 py-3 text-sm font-semibold text-white hover:bg-coral/20 disabled:opacity-50">
                      <Trash2 className="mr-2 h-4 w-4" />Delete
                    </button>
                  ) : null}
                </div>
              </form>
            </>
          )}

          <div className="mt-8 border-t border-white/10 pt-6">
            <h3 className="text-sm font-semibold">Appearance and export</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-medium text-white/62">QR colour<input type="color" value={foreground} onChange={(event) => setForeground(event.target.value)} className="mt-2 block h-11 w-full cursor-pointer border border-white/12 bg-black/20 p-1" /></label>
              <label className="text-xs font-medium text-white/62">Background<input type="color" value={background} disabled={transparent} onChange={(event) => setBackground(event.target.value)} className="mt-2 block h-11 w-full cursor-pointer border border-white/12 bg-black/20 p-1 disabled:opacity-30" /></label>
              <label className="text-xs font-medium text-white/62">Resolution<select value={size} onChange={(event) => setSize(Number(event.target.value))} className="mt-2 h-11 w-full border border-white/12 bg-steel px-3 text-sm text-white"><option value={512}>512 px</option><option value={1024}>1024 px</option><option value={2048}>2048 px</option></select></label>
              <label className="text-xs font-medium text-white/62">Error correction<select value={level} onChange={(event) => setLevel(event.target.value as CorrectionLevel)} className="mt-2 h-11 w-full border border-white/12 bg-steel px-3 text-sm text-white"><option value="L">Low</option><option value="M">Medium</option><option value="Q">High</option><option value="H">Maximum</option></select></label>
            </div>
            <label className="mt-4 flex items-start gap-3 border border-white/10 bg-white/[0.025] p-3 text-xs text-white/62">
              <input type="checkbox" checked={transparent} onChange={(event) => setTransparent(event.target.checked)} className="mt-0.5 h-4 w-4 accent-cyan-300" />
              <span><strong className="block text-white/82">Transparent background</strong><span className="mt-1 block text-white/40">For placing the QR code over your own artwork.</span></span>
            </label>
          </div>
        </section>

        <section className="flex min-w-0 flex-col border border-white/12 bg-white/[0.045] p-4 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-pulse">Live preview</p>
              <h2 className="mt-2 text-2xl font-semibold">Ready for print</h2>
            </div>
            {mode === "dynamic" ? <Link2 className="h-5 w-5 text-volt" /> : <Download className="h-5 w-5 text-pulse" />}
          </div>
          <div className="mx-auto mt-6 grid aspect-square w-full max-w-[560px] place-items-center overflow-hidden bg-white p-5 sm:p-9">
            {value ? (
              <QRCodeCanvas id="pulsetap-qr-canvas" value={value} size={size} level={level} fgColor={foreground} bgColor={transparent ? "#00000000" : background} marginSize={4} style={{ width: "100%", height: "auto", maxWidth: "100%" }} />
            ) : (
              <div className="max-w-xs text-center text-ink">
                <span className="mx-auto block h-12 w-12 border-8 border-ink border-b-transparent border-r-transparent" />
                <p className="mt-5 text-sm font-semibold">Your QR code will appear here</p>
                <p className="mt-2 text-xs leading-5 text-black/50">Choose static or dynamic, then enter the destination.</p>
              </div>
            )}
          </div>
          <p className="mt-4 text-center text-xs text-white/44">{previewDescription}</p>
          <div id="pulsetap-qr-svg" className="hidden" aria-hidden="true">
            {value ? <QRCodeSVG value={value} size={size} level={level} fgColor={foreground} bgColor={transparent ? "transparent" : background} marginSize={4} /> : null}
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            <button type="button" disabled={!value} onClick={downloadPng} className="focus-ring inline-flex items-center justify-center bg-white px-5 py-3 text-sm font-semibold text-ink hover:bg-pulse disabled:cursor-not-allowed disabled:opacity-35"><Download className="mr-2 h-4 w-4" />Download PNG</button>
            <button type="button" disabled={!value} onClick={downloadSvg} className="focus-ring inline-flex items-center justify-center border border-white/14 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"><Download className="mr-2 h-4 w-4" />Download SVG</button>
          </div>
          <div className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-white/40">
            No watermark. No trial. Static codes are generated only in your browser. Dynamic codes remain free and editable from your PulseTap account.
          </div>
        </section>
      </div>
    </div>
  );
}
