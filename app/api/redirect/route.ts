import { NextResponse } from "next/server";
import { findCardById } from "@/lib/cards";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id") ?? "";
  const card = findCardById(id);

  if (!card || !card.activated || !card.redirectUrl) {
    return NextResponse.redirect(new URL("/activate", request.url));
  }

  card.taps += 1;

  return NextResponse.redirect(card.redirectUrl, {
    status: 302
  });
}
