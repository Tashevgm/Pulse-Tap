import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, LockKeyhole, QrCode, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "NFC & QR Tools",
  description: "Free QR code generation and NFC programming available by enquiry only."
};

export default function ToolsPage() {
  return (
    <main className="min-h-screen bg-ink">
      <section className="bg-premium-radial px-5 py-16 md:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-semibold uppercase text-pulse">PulseTap Applications</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold md:text-7xl">Tools for making and managing connected products.</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/62 md:text-lg">
            Generate QR codes for free or enquire about NFC programming for your business.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-px border-y border-white/10 bg-white/10 md:grid-cols-2">
        <Link href="/tools/qr" className="group bg-ink p-7 transition hover:bg-white/[0.045] md:p-10">
          <QrCode className="h-7 w-7 text-pulse" />
          <p className="mt-10 text-xs font-semibold uppercase text-volt">Public and free</p>
          <h2 className="mt-3 text-3xl font-semibold">QR Code Generator</h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-white/56">Create static QR codes without an account, or use a free account for editable dynamic codes and scan counts.</p>
          <span className="mt-8 inline-flex items-center text-sm font-semibold text-white">Open QR generator<ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" /></span>
        </Link>

        <Link href="/tools/nfc-encoder" className="group bg-ink p-7 transition hover:bg-white/[0.045] md:p-10">
          <LockKeyhole className="h-7 w-7 text-pulse" />
          <p className="mt-10 text-xs font-semibold uppercase text-coral">Locked ? Enquiries only</p>
          <h2 className="mt-3 text-3xl font-semibold">NFC Programming</h2>
          <p className="mt-4 max-w-lg text-sm leading-7 text-white/56">NFC programming access is available by arrangement. Contact us to discuss your business and production requirements.</p>
          <span className="mt-8 inline-flex items-center text-sm font-semibold text-white">Enquire about access<ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" /></span>
        </Link>
      </section>

      <section className="mx-auto flex max-w-7xl items-start gap-4 px-5 py-12 text-sm leading-6 text-white/50">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-volt" />
        <p>QR creation has no watermark or trial period. NFC programming is locked and available by enquiry only.</p>
      </section>
    </main>
  );
}
