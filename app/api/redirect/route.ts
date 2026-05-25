import { NextResponse } from "next/server";
import { findCardById, recordTap } from "@/lib/card-repository";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") ?? "";
  const card = await findCardById(id);

  if (!card || !card.redirectUrl) {
    const activateUrl = new URL("/activate", request.url);

    if (card?.claimToken) {
      activateUrl.searchParams.set("claim", card.claimToken);
    }

    return NextResponse.redirect(activateUrl);
  }

  await recordTap(card.id, {
    userAgent: request.headers.get("user-agent") ?? undefined,
    referrer: request.headers.get("referer") ?? undefined
  });

  return NextResponse.redirect(card.redirectUrl, {
    status: 302
  });
}
