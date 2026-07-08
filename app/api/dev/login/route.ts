import { NextResponse } from "next/server";
import { ensureActivationProfile } from "@/lib/user-repository";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      {
        ok: false,
        message: "Dev login is disabled in production."
      },
      { status: 404 }
    );
  }

  const requestUrl = new URL(request.url);
  const userId = await ensureActivationProfile();
  const response = NextResponse.redirect(new URL("/dashboard", requestUrl.origin));

  response.cookies.set("pulsetap_user_id", userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  return response;
}
