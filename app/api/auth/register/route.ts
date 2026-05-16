import { NextResponse } from "next/server";
import { registerEmailUser } from "@/lib/user-store";

export async function POST(request: Request) {
  try {
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
