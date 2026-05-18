import { NextResponse } from "next/server";
import { registerEmailUser } from "@/lib/user-store";
import { hasSupabaseEnv, createSupabaseServerClient } from "@/lib/supabase/server";
import { upsertProfileForAuthUser } from "@/lib/supabase/profile";

export async function POST(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      companyName?: string;
    };

    const name = body.name?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    const password = body.password ?? "";
    const companyName = body.companyName?.trim() ?? "";

    if (!name || !email || !password) {
      return NextResponse.json(
        {
          ok: false,
          message: "Name, email and password are required."
        },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Enter a valid email address."
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          ok: false,
          message: "Password must be at least 8 characters."
        },
        { status: 400 }
      );
    }

    if (hasSupabaseEnv() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const supabase = await createSupabaseServerClient();
      const emailRedirectTo = new URL("/api/auth/callback", requestUrl.origin);
      emailRedirectTo.searchParams.set("next", "/dashboard");

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: emailRedirectTo.toString(),
          data: {
            full_name: name,
            company_name: companyName || name
          }
        }
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

      if (!data.user) {
        return NextResponse.json(
          {
            ok: false,
            message: "Could not create this account."
          },
          { status: 500 }
        );
      }

      const profile = await upsertProfileForAuthUser(data.user);
      const response = NextResponse.json({
        ok: true,
        verificationSent: !data.session,
        message: data.session
          ? "Account created. You can manage your PulseTap products from your profile."
          : "Account created. Check your email to verify your address, then open your PulseTap profile.",
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
    }

    const result = await registerEmailUser({
      name,
      email,
      password,
      companyName
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 409 });
    }

    const response = NextResponse.json({
      ok: true,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        companyName: result.user.companyName
      }
    });

    response.cookies.set("pulsetap_user_id", result.user.id, {
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
        message: "Could not create this account."
      },
      { status: 500 }
    );
  }
}
