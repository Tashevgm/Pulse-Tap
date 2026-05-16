import { NextResponse } from "next/server";
import { findCardByActivationCode, normalizeUrl } from "@/lib/cards";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      activationCode?: string;
      redirectUrl?: string;
    };

    const activationCode = body.activationCode?.trim() ?? "";
    const redirectUrl = normalizeUrl(body.redirectUrl ?? "");

    if (!activationCode || !redirectUrl) {
      return NextResponse.json(
        {
          ok: false,
          message: "Activation code and destination URL are required."
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

    const card = findCardByActivationCode(activationCode);

    if (!card) {
      return NextResponse.json(
        {
          ok: false,
          message: "Activation code was not found. Check the printed code and try again."
        },
        { status: 404 }
      );
    }

    card.redirectUrl = redirectUrl;
    card.activated = true;
    card.updatedAt = new Date().toISOString().slice(0, 10);

    return NextResponse.json({
      ok: true,
      message: "Your PulseTap product is active. NFC and QR traffic will now open the destination URL.",
      card: {
        id: card.id,
        redirectUrl: card.redirectUrl,
        type: card.type
      }
    });
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
