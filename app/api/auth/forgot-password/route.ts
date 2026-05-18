import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const body = (await request.json()) as {
      email?: string;
    };
    const email = body.email?.trim().toLowerCase() ?? "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Enter a valid email address."
        },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const redirectTo = new URL("/api/auth/callback", requestUrl.origin);
    redirectTo.searchParams.set("type", "recovery");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectTo.toString()
    });

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          message: error.message
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: "If an account exists for this email, a password reset link has been sent."
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Could not send a password reset email."
      },
      { status: 500 }
    );
  }
}
