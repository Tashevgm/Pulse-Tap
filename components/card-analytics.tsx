"use client";

import { useMemo, useState } from "react";
import { BarChart3, CalendarDays, Clock3, MousePointerClick, Star, TrendingUp } from "lucide-react";
import type { Card } from "@/lib/cards";
import type { TapEvent } from "@/lib/supabase/card-store";

type CardAnalyticsProps = {
  cards: Card[];
  tapEvents: TapEvent[];
};

type RangeKey = "7d" | "30d" | "all";
type ViewKey = "trend" | "products";

const ranges: Array<{ key: RangeKey; label: string; days?: number }> = [
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "all", label: "All time" }
];

function formatDateTime(value?: string) {
  if (!value) {
    return "No taps yet";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
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

function formatLongDate(value?: string) {
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

function formatRangeDate(value: Date) {
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

  const days = Math.round(hours / 24);
  return `${days} days ago`;
}

function localDateKey(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function cardTypeLabel(card: Card) {
  if (card.type === "google-review" || card.type === "google-review-stand") {
    return "Review page visits";
  }

  if (card.type === "instagram") {
    return "Instagram visits";
  }

  if (card.type === "facebook") {
    return "Facebook visits";
  }

  return "Link visits";
}

function filterEvents(tapEvents: TapEvent[], range: RangeKey) {
  const selected = ranges.find((item) => item.key === range);

  if (!selected?.days) {
    return tapEvents;
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - selected.days + 1);
  cutoff.setHours(0, 0, 0, 0);

  return tapEvents.filter((event) => new Date(event.createdAt) >= cutoff);
}

function filterEventsFromStart(tapEvents: TapEvent[], startDate: Date) {
  return tapEvents.filter((event) => new Date(event.createdAt) >= startDate);
}

function countPreviousPeriodEvents(tapEvents: TapEvent[], range: RangeKey) {
  const selected = ranges.find((item) => item.key === range);

  if (!selected?.days) {
    return null;
  }

  const currentStart = new Date();
  currentStart.setDate(currentStart.getDate() - selected.days + 1);
  currentStart.setHours(0, 0, 0, 0);

  const previousStart = new Date(currentStart);
  previousStart.setDate(previousStart.getDate() - selected.days);

  return tapEvents.filter((event) => {
    const date = new Date(event.createdAt);
    return date >= previousStart && date < currentStart;
  }).length;
}

function startOfLocalDay(value: Date | string) {
  const date = typeof value === "string" ? new Date(value) : new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function daysBetween(start: Date, end: Date) {
  const startDate = startOfLocalDay(start);
  const endDate = startOfLocalDay(end);
  return Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1);
}

function getAnalyticsStartDate(cards: Card[], range: RangeKey) {
  const today = startOfLocalDay(new Date());
  const selected = ranges.find((item) => item.key === range);
  const activatedDates = cards
    .map((card) => card.activatedAt)
    .filter(Boolean)
    .map((value) => startOfLocalDay(value as string))
    .sort((a, b) => a.getTime() - b.getTime());
  const firstActivation = activatedDates[0] ?? today;

  if (!selected?.days) {
    return firstActivation;
  }

  const rangeStart = new Date(today);
  rangeStart.setDate(rangeStart.getDate() - selected.days + 1);

  return firstActivation > rangeStart ? firstActivation : rangeStart;
}

function buildTrend(tapEvents: TapEvent[], range: RangeKey, startDate: Date) {
  const selected = ranges.find((item) => item.key === range);
  const today = startOfLocalDay(new Date());
  const dayCount = selected?.days ? daysBetween(startDate, today) : daysBetween(startDate, today);
  const days = Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    const key = localDateKey(date);

    return {
      key,
      label:
        daysBetween(startDate, today) <= 7
          ? new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(date)
          : new Intl.DateTimeFormat("en-GB", { day: "2-digit" }).format(date),
      fullLabel: formatShortDate(date),
      count: 0
    };
  });

  const dayByKey = new Map(days.map((day) => [day.key, day]));

  for (const event of tapEvents) {
    const day = dayByKey.get(localDateKey(event.createdAt));

    if (day) {
      day.count += 1;
    }
  }

  return days;
}

export function CardAnalytics({ cards, tapEvents }: CardAnalyticsProps) {
  const [range, setRange] = useState<RangeKey>("7d");
  const [view, setView] = useState<ViewKey>("trend");

  const analytics = useMemo(() => {
    const startDate = getAnalyticsStartDate(cards, range);
    const scopedEvents = filterEventsFromStart(filterEvents(tapEvents, range), startDate);
    const totalTaps = scopedEvents.length;
    const activeCards = cards.filter((card) => card.activated).length;
    const tapsByCard = new Map<string, number>();

    for (const event of scopedEvents) {
      tapsByCard.set(event.cardId, (tapsByCard.get(event.cardId) ?? 0) + 1);
    }

    const cardsWithActivity = cards
      .map((card) => ({
        card,
        scopedTaps: tapsByCard.get(card.id) ?? 0,
        allTimeTaps: card.taps
      }))
      .sort((a, b) => b.scopedTaps - a.scopedTaps || b.allTimeTaps - a.allTimeTaps);

    const topCard = cardsWithActivity[0]?.card;
    const lastTap = scopedEvents[0]?.createdAt ?? tapEvents[0]?.createdAt ?? cards.map((card) => card.lastTappedAt).filter(Boolean).sort().at(-1);
    const trend = buildTrend(scopedEvents, range, startDate);
    const maxTrend = Math.max(...trend.map((day) => day.count), 1);
    const previousPeriodTaps = countPreviousPeriodEvents(tapEvents, range);
    const bestDay = [...trend].sort((a, b) => b.count - a.count)[0];
    const rangeEnd = startOfLocalDay(new Date());

    return {
      scopedEvents,
      totalTaps,
      activeCards,
      cardsWithActivity,
      topCard,
      lastTap,
      trend,
      maxTrend,
      previousPeriodTaps,
      bestDay,
      startDate,
      rangeEnd
    };
  }, [cards, range, tapEvents]);

  if (cards.length === 0) {
    return null;
  }

  const rangeLabel = ranges.find((item) => item.key === range)?.label ?? "Selected period";
  const previousChange =
    analytics.previousPeriodTaps === null
      ? null
      : analytics.previousPeriodTaps === 0
        ? analytics.totalTaps > 0
          ? "New activity"
          : "No previous activity"
        : `${analytics.totalTaps >= analytics.previousPeriodTaps ? "+" : ""}${Math.round(
            ((analytics.totalTaps - analytics.previousPeriodTaps) / analytics.previousPeriodTaps) * 100
          )}% vs previous ${rangeLabel.toLowerCase()}`;
  const dateWindow = `${formatRangeDate(analytics.startDate)} - ${formatRangeDate(analytics.rangeEnd)} ${analytics.rangeEnd.getFullYear()}`;
  const topCardActivity = analytics.cardsWithActivity[0]?.scopedTaps ?? 0;

  return (
    <section className="px-5 pt-10">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#080c12]/85 shadow-soft">
        <div className="grid gap-6 border-b border-white/8 bg-gradient-to-br from-white/[0.045] via-transparent to-pulse/[0.035] p-5 md:grid-cols-[1fr_auto] md:items-start md:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pulse">Analytics</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Card analytics</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68">
              Track taps and redirect visits across your active products. PulseTap tracks taps and redirect visits. It
              does not confirm whether a customer submitted a Google review.
            </p>
          </div>

          <div className="flex flex-col gap-3 md:items-end">
            <div className="flex flex-wrap gap-2 rounded-full border border-white/10 bg-black/30 p-1">
              {ranges.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setRange(item.key)}
                  className={`focus-ring rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                    range === item.key
                      ? "border border-pulse bg-pulse/10 text-white shadow-[0_0_24px_rgba(77,243,255,0.16)]"
                      : "text-white/54 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="inline-flex items-center rounded-full border border-white/10 bg-black/24 px-4 py-2 text-sm text-white/68">
              <CalendarDays className="mr-2 h-4 w-4 text-white/42" />
              {dateWindow}
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4 md:p-6">
          {[
            {
              label: `Taps in ${rangeLabel.toLowerCase()}`,
              value: analytics.totalTaps,
              detail: previousChange,
              icon: MousePointerClick
            },
            {
              label: "Active cards",
              value: analytics.activeCards,
              detail: analytics.activeCards === cards.length ? "All systems active" : `${cards.length - analytics.activeCards} inactive`,
              icon: Star
            },
            {
              label: "Top card",
              value: analytics.topCard?.label ?? "None",
              detail: topCardActivity ? `${topCardActivity} taps` : "No taps yet",
              icon: BarChart3
            },
            {
              label: "Last tap",
              value: formatLongDate(analytics.lastTap),
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
              <p className={`mt-2 text-xs ${stat.detail?.startsWith("+") || stat.detail === "New activity" || stat.detail === "All systems active" ? "text-volt" : "text-white/42"}`}>
                {stat.detail}
              </p>
            </div>
          ))}
        </div>

        <div className="px-5 pb-5 md:px-6 md:pb-6">
          {view === "trend" ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-pulse" />
                    <h3 className="text-xl font-semibold">Tap trend</h3>
                  </div>
                  <p className="mt-2 text-sm text-white/54">
                    Daily taps from {dateWindow}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "trend" as const, label: "Taps" },
                    { key: "products" as const, label: "Products" }
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setView(item.key)}
                      className={`focus-ring rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        view === item.key
                          ? "border-white/14 bg-white/8 text-white"
                          : "border-white/10 text-white/54 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 grid grid-cols-[auto_1fr] gap-3">
                <div className="flex h-48 flex-col justify-between pb-9 text-xs text-white/42">
                  {[analytics.maxTrend, Math.ceil(analytics.maxTrend * 0.66), Math.ceil(analytics.maxTrend * 0.33), 0].map((value, index) => (
                    <span key={`${value}-${index}`}>{value}</span>
                  ))}
                </div>
                <div className="relative">
                  <div className="absolute inset-x-0 top-0 h-px bg-white/8" />
                  <div className="absolute inset-x-0 top-1/3 h-px bg-white/8" />
                  <div className="absolute inset-x-0 top-2/3 h-px bg-white/8" />
                  <div className="absolute inset-x-0 bottom-9 h-px bg-white/10" />
                  <div className="relative flex h-48 items-end gap-2 overflow-x-auto pb-2">
                {analytics.trend.map((day) => (
                  <div key={day.key} className="group relative flex min-w-16 flex-1 flex-col items-center gap-2">
                    <span className="text-sm font-semibold text-white">{day.count > 0 ? day.count : ""}</span>
                    <div className="flex h-32 w-full min-w-10 items-end justify-center">
                      <div
                        className="w-full max-w-16 rounded-t-lg bg-gradient-to-t from-[#0b6f7d] via-[#12bfd1] to-pulse shadow-[0_0_24px_rgba(77,243,255,0.18)] transition group-hover:brightness-125"
                        title={`${day.fullLabel}: ${day.count} taps`}
                        style={{
                          height: `${Math.max((day.count / analytics.maxTrend) * 100, day.count > 0 ? 18 : 2)}%`
                        }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-white/72">{day.fullLabel.split(" ")[0]}</p>
                      <p className="text-[11px] text-white/42">{day.label}</p>
                    </div>
                    <div className="pointer-events-none absolute bottom-44 hidden w-44 rounded-2xl border border-white/10 bg-[#0b0e14] p-3 text-left text-xs shadow-soft group-hover:block">
                      <p className="font-semibold text-white">{day.fullLabel}</p>
                      <p className="mt-2 text-pulse">Taps: {day.count}</p>
                      <p className="mt-1 text-pulse">Redirect visits: {analytics.totalTaps}</p>
                    </div>
                  </div>
                ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-semibold">Product activity</h3>
                  <p className="mt-2 text-sm text-white/54">Tap performance by card for {dateWindow}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: "trend" as const, label: "Taps" },
                    { key: "products" as const, label: "Products" }
                  ].map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setView(item.key)}
                      className={`focus-ring rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        view === item.key
                          ? "border-white/14 bg-white/8 text-white"
                          : "border-white/10 text-white/54 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {analytics.cardsWithActivity.map(({ card, scopedTaps, allTimeTaps }) => {
                const maxCardTaps = Math.max(...analytics.cardsWithActivity.map((item) => item.scopedTaps), 1);

                return (
                  <div key={card.id} className="rounded-3xl border border-white/10 bg-black/18 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-pulse">
                          {cardTypeLabel(card)}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold">{card.label}</h3>
                        <p className="mt-1 text-sm text-white/48">{card.id}</p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          card.activated ? "bg-emerald-400/14 text-emerald-200" : "bg-white/8 text-white/52"
                        }`}
                      >
                        {card.activated ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="mt-4 h-2 rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-pulse"
                        style={{ width: `${Math.max((scopedTaps / maxCardTaps) * 100, scopedTaps > 0 ? 8 : 0)}%` }}
                      />
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-white/42">Selected</p>
                        <p className="mt-1 font-semibold">{scopedTaps}</p>
                      </div>
                      <div>
                        <p className="text-white/42">All time</p>
                        <p className="mt-1 font-semibold">{allTimeTaps}</p>
                      </div>
                      <div>
                        <p className="text-white/42">Last tap</p>
                        <p className="mt-1 font-semibold">{formatDateTime(card.lastTappedAt)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
