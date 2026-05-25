"use client";

import { useMemo, useState } from "react";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Link2,
  MousePointerClick,
  QrCode,
  Search,
  TrendingUp
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { Card } from "@/lib/cards";
import type { TapEvent } from "@/lib/supabase/card-store";

type CardAnalyticsProps = {
  cards: Card[];
  tapEvents: TapEvent[];
};

type RangeKey = "7d" | "30d" | "all";
type ViewKey = "taps" | "products";

const ranges: Array<{ key: RangeKey; label: string; days?: number }> = [
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "all", label: "All time" }
];

function publicTapLink(card: Card) {
  return `https://www.pulse-tap.com/t/${card.claimToken}`;
}

function localDateKey(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function startOfLocalDay(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDate(value?: string) {
  if (!value) {
    return "No taps yet";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatShortDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short"
  }).format(value);
}

function formatRelativeTime(value?: string) {
  if (!value) {
    return "No activity yet";
  }

  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));

  if (minutes < 60) {
    return `${minutes} min ago`;
  }

  const hours = Math.round(minutes / 60);

  if (hours < 24) {
    return `${hours} hours ago`;
  }

  return `${Math.round(hours / 24)} days ago`;
}

function productLabel(card: Card) {
  if (card.type === "b2b-customer") {
    return "B2B customer card";
  }

  if (card.type === "google-review") {
    return "Google review card";
  }

  if (card.type === "google-review-stand") {
    return "Google review stand";
  }

  if (card.type === "instagram") {
    return "Instagram tap card";
  }

  return "Facebook tap card";
}

function trackingLabel(card: Card) {
  return card.type === "google-review" || card.type === "google-review-stand" ? "Review page visits" : "Redirect visits";
}

function daysBetween(start: Date, end: Date) {
  const startDate = startOfLocalDay(start);
  const endDate = startOfLocalDay(end);
  return Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1);
}

function rangeStartForCard(card: Card, range: RangeKey) {
  const today = startOfLocalDay(new Date());
  const activationStart = card.activatedAt ? startOfLocalDay(card.activatedAt) : today;
  const selected = ranges.find((item) => item.key === range);

  if (!selected?.days) {
    return activationStart;
  }

  const rangeStart = new Date(today);
  rangeStart.setDate(today.getDate() - selected.days + 1);

  return activationStart > rangeStart ? activationStart : rangeStart;
}

function filterByRange(events: TapEvent[], startDate: Date) {
  return events.filter((event) => new Date(event.createdAt) >= startDate);
}

function countPreviousPeriodEvents(events: TapEvent[], range: RangeKey) {
  const selected = ranges.find((item) => item.key === range);

  if (!selected?.days) {
    return null;
  }

  const currentStart = new Date();
  currentStart.setDate(currentStart.getDate() - selected.days + 1);
  currentStart.setHours(0, 0, 0, 0);

  const previousStart = new Date(currentStart);
  previousStart.setDate(previousStart.getDate() - selected.days);

  return events.filter((event) => {
    const date = new Date(event.createdAt);
    return date >= previousStart && date < currentStart;
  }).length;
}

function buildTrend(events: TapEvent[], startDate: Date) {
  const today = startOfLocalDay(new Date());
  const dayCount = daysBetween(startDate, today);
  const days = Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return {
      key: localDateKey(date),
      dayLabel: new Intl.DateTimeFormat("en-GB", { day: "2-digit" }).format(date),
      weekdayLabel: new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(date),
      fullLabel: formatShortDate(date),
      count: 0
    };
  });

  const dayByKey = new Map(days.map((day) => [day.key, day]));

  for (const event of events) {
    const day = dayByKey.get(localDateKey(event.createdAt));

    if (day) {
      day.count += 1;
    }
  }

  return days;
}

export function CardAnalytics({ cards, tapEvents }: CardAnalyticsProps) {
  const [range, setRange] = useState<RangeKey>("7d");
  const [view, setView] = useState<ViewKey>("taps");
  const [selectedCardId, setSelectedCardId] = useState(cards[0]?.id ?? "");
  const [query, setQuery] = useState("");

  const selectedCard = cards.find((card) => card.id === selectedCardId) ?? cards[0];

  const analytics = useMemo(() => {
    if (!selectedCard) {
      return null;
    }

    const cardEvents = tapEvents.filter((event) => event.cardId === selectedCard.id);
    const startDate = rangeStartForCard(selectedCard, range);
    const scopedEvents = filterByRange(cardEvents, startDate);
    const trend = buildTrend(scopedEvents, startDate);
    const maxTrend = Math.max(...trend.map((day) => day.count), 1);
    const previousPeriodTaps = countPreviousPeriodEvents(cardEvents, range);
    const accountPeriodTaps = tapEvents.filter((event) => new Date(event.createdAt) >= startDate).length;
    const accountShare = accountPeriodTaps > 0 ? Math.round((scopedEvents.length / accountPeriodTaps) * 100) : 0;
    const dateWindow = `${formatShortDate(startDate)} - ${formatShortDate(startOfLocalDay(new Date()))} ${new Date().getFullYear()}`;

    return {
      cardEvents,
      scopedEvents,
      trend,
      maxTrend,
      previousPeriodTaps,
      accountShare,
      dateWindow,
      startDate,
      lastTap: scopedEvents[0]?.createdAt ?? selectedCard.lastTappedAt
    };
  }, [range, selectedCard, tapEvents]);

  const cardsWithPeriodTaps = useMemo(() => {
    const search = query.trim().toLowerCase();

    return cards
      .map((card) => {
        const startDate = rangeStartForCard(card, range);
        const count = tapEvents.filter((event) => event.cardId === card.id && new Date(event.createdAt) >= startDate).length;

        return {
          card,
          count
        };
      })
      .filter(({ card }) =>
        search ? [card.id, card.label, productLabel(card), card.database].join(" ").toLowerCase().includes(search) : true
      )
      .sort((a, b) => b.count - a.count || b.card.taps - a.card.taps);
  }, [cards, query, range, tapEvents]);

  if (!selectedCard || !analytics) {
    return null;
  }

  const rangeLabel = ranges.find((item) => item.key === range)?.label ?? "Selected period";
  const previousText =
    analytics.previousPeriodTaps === null
      ? "All-time view"
      : analytics.previousPeriodTaps === 0
        ? analytics.scopedEvents.length > 0
          ? "New activity"
          : "No previous activity"
        : `${analytics.scopedEvents.length >= analytics.previousPeriodTaps ? "+" : ""}${Math.round(
            ((analytics.scopedEvents.length - analytics.previousPeriodTaps) / analytics.previousPeriodTaps) * 100
          )}% vs previous ${rangeLabel.toLowerCase()}`;

  return (
    <section className="px-5 pt-10">
      <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#080c12] shadow-soft lg:grid-cols-[300px_1fr]">
        <aside className="border-b border-white/10 bg-white/[0.025] p-4 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-ink">
              <MousePointerClick className="h-4 w-4" />
            </span>
            <span className="text-sm font-semibold">PulseTap</span>
          </div>

          <label className="mt-5 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/24 px-3 py-2">
            <Search className="h-4 w-4 text-white/38" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent text-sm text-white placeholder:text-white/34 focus:outline-none"
              placeholder="Search cards"
            />
          </label>

          <div className="mt-4 max-h-[520px] space-y-2 overflow-y-auto pr-1">
            {cardsWithPeriodTaps.map(({ card, count }) => (
              <button
                key={card.id}
                type="button"
                onClick={() => setSelectedCardId(card.id)}
                className={`focus-ring w-full rounded-2xl border p-3 text-left transition ${
                  selectedCard.id === card.id ? "border-pulse/60 bg-pulse/10" : "border-white/10 bg-black/18 hover:border-white/22"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-pulse">{card.database} product</p>
                    <p className="mt-1 text-sm font-semibold">{card.label}</p>
                    <p className="mt-0.5 text-xs text-white/42">{productLabel(card)}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${card.activated ? "bg-volt/15 text-volt" : "bg-coral/15 text-coral"}`}>
                    {card.activated ? "Active" : "Setup"}
                  </span>
                </div>
                <div className="mt-3 flex justify-between text-xs text-white/46">
                  <span>Taps: {count}</span>
                  <span>{formatRelativeTime(card.lastTappedAt)}</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <div>
          <div className="grid gap-5 border-b border-white/8 bg-gradient-to-br from-white/[0.045] via-transparent to-pulse/[0.035] p-5 md:grid-cols-[1fr_auto] md:p-6">
            <div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-ink">{selectedCard.id}</span>
                <span className="rounded-full border border-white/14 bg-black/20 px-3 py-1 text-xs font-semibold text-white/72">
                  {productLabel(selectedCard)}
                </span>
              </div>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">{selectedCard.label}</h2>
              <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-white/62">
                <span className="inline-flex items-center gap-1 text-volt">
                  <span className="h-1.5 w-1.5 rounded-full bg-volt" />
                  {selectedCard.activated ? "Active PulseTap link" : "Needs setup"}
                </span>
                <span>Updated {selectedCard.updatedAt}</span>
              </p>
            </div>

            <div className="flex flex-col gap-3 md:items-end">
              <div className="flex flex-wrap gap-2 rounded-full border border-white/10 bg-black/30 p-1">
                {ranges.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setRange(item.key)}
                    className={`focus-ring rounded-full px-4 py-2 text-sm font-semibold transition ${
                      range === item.key ? "border border-pulse bg-pulse/10 text-white" : "text-white/54 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="inline-flex items-center rounded-full border border-white/10 bg-black/24 px-4 py-2 text-sm text-white/68">
                <CalendarDays className="mr-2 h-4 w-4 text-white/42" />
                {analytics.dateWindow}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white p-3 text-ink md:row-span-2 md:w-32">
              <QRCodeSVG value={publicTapLink(selectedCard)} size={104} />
              <div className="mt-2 flex items-center justify-center gap-1 text-[11px] font-semibold">
                <QrCode className="h-3.5 w-3.5" />
                QR backup
              </div>
            </div>
          </div>

          <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4 md:p-6">
            {[
              {
                label: `Taps in ${rangeLabel.toLowerCase()}`,
                value: analytics.scopedEvents.length,
                detail: previousText,
                icon: MousePointerClick
              },
              {
                label: "Card status",
                value: selectedCard.activated ? "Active" : "Setup",
                detail: selectedCard.activated ? "Redirect is live" : "Destination needed",
                icon: CheckCircle2
              },
              {
                label: "Account share",
                value: `${analytics.accountShare}%`,
                detail: `${analytics.scopedEvents.length} of period taps`,
                icon: BarChart3
              },
              {
                label: "Last tap",
                value: formatDate(analytics.lastTap),
                detail: formatRelativeTime(analytics.lastTap),
                icon: Clock3
              }
            ].map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="flex items-center gap-3">
                  <stat.icon className="h-5 w-5 text-pulse" />
                  <p className="text-sm text-white/58">{stat.label}</p>
                </div>
                <p className="mt-4 line-clamp-2 text-2xl font-semibold leading-tight">{stat.value}</p>
                <p className={`mt-2 text-xs ${stat.detail.startsWith("+") || stat.detail === "New activity" || stat.detail === "Redirect is live" ? "text-volt" : "text-white/42"}`}>
                  {stat.detail}
                </p>
              </div>
            ))}
          </div>

          <div className="px-5 pb-5 md:px-6 md:pb-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-pulse" />
                    <h3 className="text-xl font-semibold">{view === "taps" ? "Tap trend" : "Card details"}</h3>
                  </div>
                  <p className="mt-2 text-sm text-white/54">
                    {view === "taps"
                      ? `Daily ${trackingLabel(selectedCard).toLowerCase()} from ${analytics.dateWindow}`
                      : `Selected card performance for ${analytics.dateWindow}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "taps" as const, label: "Taps" },
                    { key: "products" as const, label: "Products" }
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setView(item.key)}
                      className={`focus-ring rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        view === item.key ? "border-pulse bg-pulse/10 text-white" : "border-white/10 text-white/54 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {view === "taps" ? (
                <div className="mt-8 grid grid-cols-[auto_1fr] gap-3">
                  <div className="flex h-52 flex-col justify-between pb-10 text-xs text-white/42">
                    {[analytics.maxTrend, Math.ceil(analytics.maxTrend * 0.66), Math.ceil(analytics.maxTrend * 0.33), 0].map((value, index) => (
                      <span key={`${value}-${index}`}>{value}</span>
                    ))}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-x-0 top-0 h-px bg-white/8" />
                    <div className="absolute inset-x-0 top-1/3 h-px bg-white/8" />
                    <div className="absolute inset-x-0 top-2/3 h-px bg-white/8" />
                    <div className="absolute inset-x-0 bottom-10 h-px bg-white/10" />
                    <div className="relative flex h-52 items-end gap-3 overflow-x-auto pb-2">
                      {analytics.trend.map((day) => (
                        <div key={day.key} className="group relative flex min-w-16 flex-1 flex-col items-center gap-2">
                          <span className="text-sm font-semibold text-white">{day.count > 0 ? day.count : ""}</span>
                          <div className="flex h-36 w-full items-end justify-center">
                            <div
                              className="w-full max-w-16 rounded-t-lg bg-gradient-to-t from-[#0b6f7d] via-[#12bfd1] to-pulse shadow-[0_0_24px_rgba(77,243,255,0.18)] transition group-hover:brightness-125"
                              title={`${day.fullLabel}: ${day.count} taps`}
                              style={{
                                height: `${Math.max((day.count / analytics.maxTrend) * 100, day.count > 0 ? 18 : 2)}%`
                              }}
                            />
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-semibold text-white/72">{day.dayLabel}</p>
                            <p className="text-[11px] text-white/42">{day.weekdayLabel}</p>
                          </div>
                          <div className="pointer-events-none absolute bottom-48 hidden w-48 rounded-2xl border border-white/10 bg-[#0b0e14] p-3 text-left text-xs shadow-soft group-hover:block">
                            <p className="font-semibold text-white">{day.fullLabel}</p>
                            <p className="mt-2 text-pulse">Taps: {day.count}</p>
                            <p className="mt-1 text-pulse">{trackingLabel(selectedCard)}: {analytics.scopedEvents.length}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm text-white/46">Public tap link</p>
                    <p className="mt-2 break-all text-sm text-white/72">{publicTapLink(selectedCard)}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="text-sm text-white/46">Destination</p>
                    <p className="mt-2 break-all text-sm text-white/72">{selectedCard.redirectUrl || "No destination yet"}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <p className="flex items-center gap-2 text-sm text-white/46">
                      <Link2 className="h-4 w-4" />
                      Activation
                    </p>
                    <p className="mt-2 text-sm text-white/72">{selectedCard.activationCode}</p>
                    <p className="mt-1 text-xs text-white/38">{selectedCard.activatedAt ? formatDate(selectedCard.activatedAt) : "Not activated yet"}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
