import { NextResponse } from "next/server";
import { findCardByClaimToken, recordTap } from "@/lib/card-repository";

type RouteContext = {
  params: Promise<{
    claim: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { claim } = await context.params;
  const card = await findCardByClaimToken(claim);

  if (!card) {
    return NextResponse.redirect(new URL("/activate", request.url));
  }

  if (!card.redirectUrl) {
    const activateUrl = new URL("/activate", request.url);
    activateUrl.searchParams.set("claim", card.claimToken);
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
