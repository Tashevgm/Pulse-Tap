import type { Metadata } from "next";
import { ExternalLink, Link2, QrCode, Settings2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { mockCards } from "@/lib/cards";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage PulseTap cards, editable redirect URLs and generated QR codes."
};

export default function DashboardPage() {
  const activeCards = mockCards.filter((card) => card.activated).length;

  return (
    <main className="bg-ink px-5 py-14">
      <section className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.34em] text-pulse">Profile</p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl">
              Your PulseTap products, kept simple.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/64">
              A lightweight account space for V1: view cards, edit redirect destinations, generate QR links and prepare for profiles later.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              {[
                { label: "Cards", value: mockCards.length },
                { label: "Active", value: activeCards },
                { label: "Demo taps", value: mockCards.reduce((sum, card) => sum + card.taps, 0) }
              ].map((stat) => (
                <div key={stat.label} className="rounded-3xl border border-white/10 bg-white/[0.045] p-5">
                  <p className="text-3xl font-semibold">{stat.value}</p>
                  <p className="mt-1 text-sm text-white/50">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {mockCards.map((card) => (
              <article key={card.id} className="glass rounded-[2rem] p-5">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink">{card.id}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${card.activated ? "bg-volt/15 text-volt" : "bg-coral/15 text-coral"}`}>
                        {card.activated ? "Active" : "Not activated"}
                      </span>
                    </div>
                    <h2 className="mt-4 text-2xl font-semibold tracking-tight">{card.label}</h2>
                    <p className="mt-2 text-sm text-white/48">{card.type} · Updated {card.updatedAt}</p>
                    <div className="mt-5 rounded-2xl border border-white/10 bg-black/22 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-white/76">
                        <Link2 className="h-4 w-4 text-pulse" />
                        Redirect URL
                      </div>
                      <p className="mt-2 break-all text-sm leading-6 text-white/58">{card.redirectUrl || "No destination set yet"}</p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button className="focus-ring inline-flex items-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink">
                        <Settings2 className="mr-2 h-4 w-4" />
                        Edit URL
                      </button>
                      <a href={`/api/redirect?id=${card.id}`} target="_blank" rel="noreferrer" className="focus-ring inline-flex items-center rounded-full border border-white/14 px-4 py-2 text-sm font-semibold text-white/78">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Test Link
                      </a>
                    </div>
                  </div>
                  <div className="shrink-0 rounded-3xl border border-white/10 bg-white p-3 text-ink">
                    <QRCodeSVG value={`https://pulsetap.co.uk/api/redirect?id=${card.id}`} size={124} />
                    <div className="mt-2 flex items-center justify-center gap-1 text-xs font-semibold">
                      <QrCode className="h-3.5 w-3.5" />
                      QR ready
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
