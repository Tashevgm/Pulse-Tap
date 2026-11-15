import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/navigation";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const supabase = await createSupabaseServerClient();
  const next = safeInternalPath(requestUrl.searchParams.get("next"));
  const redirectTo = new URL("/api/auth/callback", requestUrl.origin);
  redirectTo.searchParams.set("next", next);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: redirectTo.toString(),
      queryParams: {
        access_type: "offline",
        prompt: "consent"
      }
    }
  });

  if (error || !data.url) {
    return NextResponse.redirect(new URL("/signup?error=google", requestUrl.origin));
  }

  return NextResponse.redirect(data.url);
}
