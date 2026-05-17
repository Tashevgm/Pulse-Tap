import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { normalizeUrl } from "@/lib/cards";
import { activateCard, activateCardByClaimToken, findCardByActivationCode, findCardByClaimToken } from "@/lib/card-repository";
import { registerDemoGoogleUser } from "@/lib/user-store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      activationCode?: string;
      claimToken?: string;
      redirectUrl?: string;
    };

    const activationCode = body.activationCode?.trim() ?? "";
    const claimToken = body.claimToken?.trim() ?? "";
    const redirectUrl = normalizeUrl(body.redirectUrl ?? "");

    if ((!activationCode && !claimToken) || !redirectUrl) {
      return NextResponse.json(
        {
          ok: false,
          message: "Card claim or activation code and destination URL are required."
        },
        { status: 400 }
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(redirectUrl);
    } catch {
      return NextResponse.json(
        {
          ok: false,
          message: "Use a valid destination URL."
        },
        { status: 400 }
      );
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Only http and https destination URLs are supported."
        },
        { status: 400 }
      );
    }

    const card = claimToken
      ? await findCardByClaimToken(claimToken)
      : await findCardByActivationCode(activationCode);

    if (!card) {
      return NextResponse.json(
        {
          ok: false,
          message: "Card was not found. Tap or scan the card again."
        },
        { status: 404 }
      );
    }

    const cookieStore = await cookies();
    let userId = cookieStore.get("pulsetap_user_id")?.value;

    if (!userId) {
      const user = await registerDemoGoogleUser();
      userId = user.id;
    }

    const activatedCard = claimToken
      ? await activateCardByClaimToken(claimToken, redirectUrl, userId)
      : await activateCard(activationCode, redirectUrl, userId);

    if (!activatedCard) {
      return NextResponse.json(
        {
          ok: false,
          message: "Card was not found. Tap or scan the card again."
        },
        { status: 404 }
      );
    }

    const response = NextResponse.json({
      ok: true,
      message: "Your PulseTap product is active. NFC and QR traffic will now open the destination URL.",
      card: {
        id: activatedCard.id,
        redirectUrl: activatedCard.redirectUrl,
        type: activatedCard.type
      }
    });

    response.cookies.set("pulsetap_user_id", userId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });

    return response;
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Activation failed. Try again in a moment."
      },
      { status: 500 }
    );
  }
}
