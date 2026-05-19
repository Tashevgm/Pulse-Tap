"use client";

import { useMemo, useState } from "react";
import { BarChart3, Clock3, MousePointerClick, Star, TrendingUp } from "lucide-react";
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

    return {
      scopedEvents,
      totalTaps,
      activeCards,
      cardsWithActivity,
      topCard,
      lastTap,
      trend,
      maxTrend,
      previousPeriodTaps
    };
  }, [cards, range, tapEvents]);

  if (cards.length === 0) {
    return null;
  }

  const rangeLabel = ranges.find((item) => item.key === range)?.label ?? "Selected period";

  return (
    <section className="px-5 pt-10">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04]">
        <div className="grid gap-6 border-b border-white/10 p-5 md:grid-cols-[1fr_auto] md:items-end md:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pulse">Activity</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Card analytics</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/58">
              Track taps and redirect visits across your active products. Review products show review page visits, not
              confirmed Google reviews.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 rounded-full border border-white/10 bg-black/20 p-1">
            {ranges.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setRange(item.key)}
                className={`focus-ring rounded-full px-4 py-2 text-sm font-semibold transition ${
                  range === item.key ? "bg-white text-ink" : "text-white/60 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4 md:p-6">
          {[
            { label: `Taps in ${rangeLabel.toLowerCase()}`, value: analytics.totalTaps, icon: MousePointerClick },
            { label: "Active cards", value: analytics.activeCards, icon: Star },
            { label: "Top product", value: analytics.topCard?.label ?? "None", icon: BarChart3 },
            { label: "Last tap", value: formatDateTime(analytics.lastTap), icon: Clock3 }
          ].map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-white/10 bg-black/18 p-4">
              <stat.icon className="h-5 w-5 text-pulse" />
              <p className="mt-4 text-sm text-white/46">{stat.label}</p>
              <p className="mt-1 line-clamp-2 text-xl font-semibold leading-tight">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="px-5 pb-5 md:px-6 md:pb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: "trend" as const, label: "Trend" },
              { key: "products" as const, label: "Products" }
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setView(item.key)}
                className={`focus-ring rounded-full border px-4 py-2 text-sm font-semibold transition ${
                  view === item.key
                    ? "border-pulse bg-pulse text-ink"
                    : "border-white/12 text-white/70 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {view === "trend" ? (
            <div className="mt-4 rounded-3xl border border-white/10 bg-black/18 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Tap trend</h3>
                  <p className="mt-1 text-sm text-white/50">
                    Daily visits from activation date within the selected period.
                  </p>
                </div>
                {analytics.previousPeriodTaps !== null ? (
                  <div className="inline-flex items-center rounded-full border border-white/10 px-3 py-1 text-sm text-white/62">
                    <TrendingUp className="mr-2 h-4 w-4 text-pulse" />
                    Previous period {analytics.previousPeriodTaps}
                  </div>
                ) : null}
              </div>

              <div className="mt-5 flex h-48 items-end gap-1.5 overflow-x-auto pb-2">
                {analytics.trend.map((day) => (
                  <div key={day.key} className="flex min-w-10 flex-1 flex-col items-center gap-2">
                    <div className="flex h-32 w-full min-w-8 items-end rounded-full bg-white/5">
                      <div
                        className="w-full rounded-full bg-gradient-to-t from-pulse to-cyan-300"
                        title={`${day.fullLabel}: ${day.count} taps`}
                        style={{
                          height: `${Math.max((day.count / analytics.maxTrend) * 100, day.count > 0 ? 12 : 3)}%`
                        }}
                      />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-white/72">{day.count}</p>
                      <p className="text-[11px] text-white/42">{day.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
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
          )}
        </div>
      </div>
    </section>
  );
}
