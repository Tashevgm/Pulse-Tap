import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { QrGenerator } from "@/components/qr-generator";
import { dynamicQrPublicUrl, listDynamicQrCodes } from "@/lib/dynamic-qr";
import { getCurrentProfile } from "@/lib/user-repository";

export const metadata: Metadata = {
  title: "Free Static & Dynamic QR Code Generator",
  description: "Create free static and dynamic QR codes with no watermark. Download PNG or SVG and manage editable links with PulseTap."
};

export default async function QrToolPage({ searchParams }: { searchParams: Promise<{ mode?: string; code?: string }> }) {
  const query = await searchParams;
  const cookieStore = await cookies();
  const profile = await getCurrentProfile(cookieStore.get("pulsetap_user_id")?.value);
  const isAuthenticated = Boolean(profile?.isAuthenticated);
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "www.pulse-tap.com";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const origin = `${protocol}://${host}`;
  let databaseReady = true;
  let codes: Awaited<ReturnType<typeof listDynamicQrCodes>> = [];

  if (isAuthenticated && profile) {
    try {
      codes = await listDynamicQrCodes(profile.id);
    } catch (error) {
      databaseReady = false;
      console.warn("Dynamic QR storage unavailable.", error);
    }
  }

  return (
    <main className="min-h-screen bg-ink">
      <section className="bg-premium-radial px-5 pb-12 pt-14 md:pb-16 md:pt-20">
        <div className="mx-auto grid max-w-7xl items-end gap-8 lg:grid-cols-[1fr_0.62fr]">
          <div>
            <p className="text-xs font-semibold uppercase text-pulse">PulseTap Free Tools</p>
            <h1 className="mt-5 max-w-4xl text-4xl font-semibold md:text-7xl">Free QR codes. Static or dynamic.</h1>
          </div>
          <p className="max-w-2xl text-base leading-7 text-white/62">
            Generate high-resolution QR codes without subscriptions, watermarks or expiry dates. Use an account only when you want an editable dynamic link.
          </p>
        </div>
      </section>
      <QrGenerator
        key={`${query.mode ?? "static"}:${query.code ?? "new"}`}
        initialMode={query.mode === "dynamic" ? "dynamic" : "static"}
        initialSelectedId={query.code}
        isAuthenticated={isAuthenticated}
        databaseReady={databaseReady}
        initialCodes={codes.map((code) => ({ ...code, publicUrl: dynamicQrPublicUrl(code.slug, origin) }))}
      />
    </main>
  );
}
