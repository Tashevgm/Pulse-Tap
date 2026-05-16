import { NextResponse } from "next/server";
import { registerDemoGoogleUser } from "@/lib/user-store";

export async function GET(request: Request) {
  const user = await registerDemoGoogleUser();
  const response = NextResponse.redirect(new URL("/dashboard", request.url));

  response.cookies.set("pulsetap_user_id", user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });

  return response;
}
