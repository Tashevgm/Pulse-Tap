import { NextResponse } from "next/server";
import { createSupabaseServerClient, hasSupabaseEnv } from "@/lib/supabase/server";
import { upsertProfileForAuthUser } from "@/lib/supabase/profile";

export async function POST(request: Request) {
  try {
    if (!hasSupabaseEnv() || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        {
          ok: false,
          message: "Login is not configured yet."
        },
        { status: 500 }
      );
    }

    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        {
          ok: false,
          message: "Email and password are required."
        },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.user) {
      return NextResponse.json(
        {
          ok: false,
          message: error?.message ?? "Could not sign in."
        },
        { status: 401 }
      );
    }

    const profile = await upsertProfileForAuthUser(data.user);
    const response = NextResponse.json({
      ok: true,
      user: {
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        companyName: profile.company_name
      }
    });

    response.cookies.set("pulsetap_user_id", profile.id, {
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
        message: "Could not sign in."
      },
      { status: 500 }
    );
  }
}
