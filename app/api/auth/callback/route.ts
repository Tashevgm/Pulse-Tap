import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { upsertProfileForAuthUser } from "@/lib/supabase/profile";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const authError = requestUrl.searchParams.get("error");
  const authErrorDescription = requestUrl.searchParams.get("error_description");
  const code = requestUrl.searchParams.get("code");
  const type = requestUrl.searchParams.get("type");
  const requestedNext = requestUrl.searchParams.get("next") ?? "/dashboard";
  const next = requestedNext.startsWith("/") ? requestedNext : "/dashboard";

  if (authError) {
    const signupUrl = new URL("/signup", requestUrl.origin);
    signupUrl.searchParams.set("error", authError);
    signupUrl.searchParams.set("message", authErrorDescription ?? "Google sign in was not completed.");
    return NextResponse.redirect(signupUrl);
  }

  if (!code) {
    const signupUrl = new URL("/signup", requestUrl.origin);
    signupUrl.searchParams.set("error", "missing-code");
    signupUrl.searchParams.set("message", "Google did not return a login code. Try signing in again.");
    return NextResponse.redirect(signupUrl);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const signupUrl = new URL("/signup", requestUrl.origin);
    signupUrl.searchParams.set("error", "callback");
    signupUrl.searchParams.set("message", error.message);
    return NextResponse.redirect(signupUrl);
  }

  if (type === "recovery") {
    return NextResponse.redirect(new URL("/reset-password", requestUrl.origin));
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    try {
      const profile = await upsertProfileForAuthUser(user);
      const response = NextResponse.redirect(new URL(next, requestUrl.origin));
      response.cookies.set("pulsetap_user_id", profile.id, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 30
      });
      return response;
    } catch (profileError) {
      const signupUrl = new URL("/signup", requestUrl.origin);
      signupUrl.searchParams.set("error", "profile");
      signupUrl.searchParams.set(
        "message",
        profileError instanceof Error ? profileError.message : "Could not create your PulseTap profile."
      );
      return NextResponse.redirect(signupUrl);
    }
  }

  const signupUrl = new URL("/signup", requestUrl.origin);
  signupUrl.searchParams.set("error", "no-user");
  signupUrl.searchParams.set("message", "Google login completed, but no user account was returned.");
  return NextResponse.redirect(signupUrl);
}
