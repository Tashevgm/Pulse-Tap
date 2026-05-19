import { BarChart3, Clock3, MousePointerClick, Star } from "lucide-react";
import type { Card } from "@/lib/cards";
import type { TapEvent } from "@/lib/supabase/card-store";

type CardAnalyticsProps = {
  cards: Card[];
  tapEvents: TapEvent[];
};

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

function buildDailyTrend(tapEvents: TapEvent[]) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return {
      key,
      label: new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(date),
      count: 0
    };
  });

  const dayByKey = new Map(days.map((day) => [day.key, day]));

  for (const event of tapEvents) {
    const key = event.createdAt.slice(0, 10);
    const day = dayByKey.get(key);

    if (day) {
      day.count += 1;
    }
  }

  return days;
}

export function CardAnalytics({ cards, tapEvents }: CardAnalyticsProps) {
  if (cards.length === 0) {
    return null;
  }

  const totalTaps = cards.reduce((sum, card) => sum + card.taps, 0);
  const activeCards = cards.filter((card) => card.activated).length;
  const topCard = [...cards].sort((a, b) => b.taps - a.taps)[0];
  const lastTap = tapEvents[0]?.createdAt ?? cards.map((card) => card.lastTappedAt).filter(Boolean).sort().at(-1);
  const trend = buildDailyTrend(tapEvents);
  const maxTrend = Math.max(...trend.map((day) => day.count), 1);

  return (
    <section className="px-5 pt-10">
      <div className="mx-auto max-w-7xl rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-pulse">Activity</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight">Card analytics</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-white/58">
            Review products show review page visits. Confirmed Google reviews require a future Google Business integration.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total taps", value: totalTaps, icon: MousePointerClick },
            { label: "Active cards", value: activeCards, icon: Star },
            { label: "Top card", value: topCard?.label ?? "None", icon: BarChart3 },
            { label: "Last tap", value: formatDateTime(lastTap), icon: Clock3 }
          ].map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-white/10 bg-black/18 p-4">
              <stat.icon className="h-5 w-5 text-pulse" />
              <p className="mt-4 text-sm text-white/46">{stat.label}</p>
              <p className="mt-1 text-xl font-semibold">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-3xl border border-white/10 bg-black/18 p-4">
          <div className="flex h-36 items-end gap-2">
            {trend.map((day) => (
              <div key={day.key} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-24 w-full items-end rounded-full bg-white/5">
                  <div
                    className="w-full rounded-full bg-pulse"
                    style={{ height: `${Math.max((day.count / maxTrend) * 100, day.count > 0 ? 12 : 3)}%` }}
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
      </div>
    </section>
  );
}
