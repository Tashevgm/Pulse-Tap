import { NextResponse } from "next/server";
import { ensureActivationProfile } from "@/lib/user-repository";
import { createSupabaseAdminClient, hasSupabaseEnv } from "@/lib/supabase/server";

export const runtime = "nodejs";

const demoCards = [
  {
    id: "DEV001",
    activation_code: "DEV-GOOGLE-001",
    claim_token: "dev-google-001",
    redirect_url: "https://www.google.com/search?q=PulseTap",
    activated: true,
    card_type: "google-review",
    card_database: "google",
    label: "Demo Google review card",
    taps: 18,
    activated_at: daysAgo(24)
  },
  {
    id: "DEV002",
    activation_code: "DEV-INSTAGRAM-002",
    claim_token: "dev-instagram-002",
    redirect_url: "https://www.instagram.com/pulsetap",
    activated: true,
    card_type: "instagram",
    card_database: "instagram",
    label: "Demo Instagram card",
    taps: 9,
    activated_at: daysAgo(14)
  },
  {
    id: "DEV003",
    activation_code: "DEV-FACEBOOK-003",
    claim_token: "dev-facebook-003",
    redirect_url: "https://www.facebook.com",
    activated: true,
    card_type: "facebook",
    card_database: "facebook",
    label: "Demo Facebook card",
    taps: 5,
    activated_at: daysAgo(8)
  }
] as const;

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(10, 0, 0, 0);
  return date.toISOString();
}

function tapTimestamp(index: number) {
  const date = new Date();
  date.setDate(date.getDate() - (index % 7));
  date.setHours(9 + (index % 9), 15, 0, 0);
  return date.toISOString();
}

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        ok: false,
        message: "Dev dashboard seed is disabled in production."
      },
      { status: 404 }
    );
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      {
        ok: false,
        message: "Supabase is required for this dev seed route."
      },
      { status: 500 }
    );
  }

  const requestUrl = new URL(request.url);
  const userId = await ensureActivationProfile();
  const supabase = createSupabaseAdminClient();
  const cardIds = demoCards.map((card) => card.id);

  await supabase.from("tap_events").delete().in("card_id", cardIds);

  const { error: cardError } = await supabase.from("cards").upsert(
    demoCards.map((card) => ({
      ...card,
      owner_profile_id: userId,
      updated_at: new Date().toISOString()
    })),
    {
      onConflict: "id"
    }
  );

  if (cardError) {
    return NextResponse.json(
      {
        ok: false,
        message: cardError.message
      },
      { status: 500 }
    );
  }

  const tapEvents = demoCards.flatMap((card) =>
    Array.from({ length: card.taps }, (_, index) => ({
      card_id: card.id,
      redirect_url: card.redirect_url,
      user_agent: "PulseTap local dashboard seed",
      referrer: "http://localhost:3000/api/dev/seed-dashboard",
      created_at: tapTimestamp(index)
    }))
  );

  const { error: eventError } = await supabase.from("tap_events").insert(tapEvents);

  if (eventError) {
    return NextResponse.json(
      {
        ok: false,
        message: eventError.message
      },
      { status: 500 }
    );
  }

  const response = NextResponse.redirect(new URL("/dashboard", requestUrl.origin));

  response.cookies.set("pulsetap_user_id", userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  return response;
}
