import { sendReviewEmailForCard } from "@/lib/review-email-trigger";
import { after, NextResponse } from "next/server";
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

  const tappedCard = await recordTap(card.id, {
    userAgent: request.headers.get("user-agent") ?? undefined,
    referrer: request.headers.get("referer") ?? undefined
  });

  if (tappedCard && tappedCard.database !== "b2b" && tappedCard.taps >= 5) {
    after(async () => {
      try {
        await sendReviewEmailForCard(tappedCard.id);
      } catch (error) {
        console.error("Tap-triggered review email failed.", error);
      }
    });
  }

  return NextResponse.redirect(card.redirectUrl, {
    status: 302
  });
}
