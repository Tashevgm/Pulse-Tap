import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      password?: string;
    };
    const password = body.password ?? "";

    if (password.length < 8) {
      return NextResponse.json(
        {
          ok: false,
          message: "Password must be at least 8 characters."
        },
        { status: 400 }
      );
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          ok: false,
          message: "This reset link has expired. Request a new password reset email."
        },
        { status: 401 }
      );
    }

    const { error } = await supabase.auth.updateUser({
      password
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
      message: "Password updated. You can now open your PulseTap profile."
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Could not update your password."
      },
      { status: 500 }
    );
  }
}
