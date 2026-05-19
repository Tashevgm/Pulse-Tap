import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { normalizeUrl } from "@/lib/cards";
import { activateCard, activateCardByClaimToken, findCardByActivationCode, findCardByClaimToken } from "@/lib/card-repository";
import { ensureActivationProfile, getCurrentProfile } from "@/lib/user-repository";
import { hasSupabaseEnv, createSupabaseServerClient } from "@/lib/supabase/server";
import { upsertProfileForAuthUser } from "@/lib/supabase/profile";
import { sendCardRegisteredEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const body = (await request.json()) as {
      activationCode?: string;
      claimToken?: string;
      redirectUrl?: string;
      account?: {
        name?: string;
        email?: string;
        password?: string;
      };
    };

    const activationCode = body.activationCode?.trim() ?? "";
    const claimToken = body.claimToken?.trim() ?? "";
    const redirectUrl = normalizeUrl(body.redirectUrl ?? "");

    if ((!activationCode && !claimToken) || !redirectUrl) {
      return NextResponse.json(
        {
          ok: false,
          message: "Card claim or activation code and destination URL are required."
        },
        { status: 400 }
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(redirectUrl);
    } catch {
      return NextResponse.json(
        {
          ok: false,
          message: "Use a valid destination URL."
        },
        { status: 400 }
      );
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return NextResponse.json(
        {
          ok: false,
          message: "Only http and https destination URLs are supported."
        },
        { status: 400 }
      );
    }

    const card = claimToken
      ? await findCardByClaimToken(claimToken)
      : await findCardByActivationCode(activationCode);

    if (!card) {
      return NextResponse.json(
        {
          ok: false,
          message: "Card was not found. Tap or scan the card again."
        },
        { status: 404 }
      );
    }

    const cookieStore = await cookies();
    const currentProfile = await getCurrentProfile(cookieStore.get("pulsetap_user_id")?.value);
    let userId = currentProfile?.id ?? "";
    let accountMessage = currentProfile
      ? currentProfile.isAuthenticated
        ? " You can manage it from your profile."
        : " Verify your email to secure long-term access to your profile."
      : "";

    if (!userId && hasSupabaseEnv() && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      const account = body.account;
      const name = account?.name?.trim() ?? "";
      const email = account?.email?.trim().toLowerCase() ?? "";
      const password = account?.password ?? "";

      if (!name || !email || !password) {
        return NextResponse.json(
          {
            ok: false,
            message: "Create an account with your name, email and password so you can manage this card later."
          },
          { status: 401 }
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
            company_name: name
          }
        }
      });

      if (error || !data.user) {
        return NextResponse.json(
          {
            ok: false,
            message: error?.message ?? "Could not create this account."
          },
          { status: 400 }
        );
      }

      const profile = await upsertProfileForAuthUser(data.user);
      userId = profile.id;
      accountMessage = data.session
        ? " You can manage this card from your profile."
        : " Check your email to verify your account, then you can manage this card from your profile.";
    }

    if (!userId) {
      userId = await ensureActivationProfile(cookieStore.get("pulsetap_user_id")?.value);
    }

    const activatedCard = claimToken
      ? await activateCardByClaimToken(claimToken, redirectUrl, userId)
      : await activateCard(activationCode, redirectUrl, userId);

    if (!activatedCard) {
      return NextResponse.json(
        {
          ok: false,
          message: "Card was not found. Tap or scan the card again."
        },
        { status: 404 }
      );
    }

    const emailProfile = await getCurrentProfile(userId);

    if (emailProfile?.email) {
      await sendCardRegisteredEmail({
        to: emailProfile.email,
        card: activatedCard,
        dashboardUrl: new URL("/dashboard", requestUrl.origin).toString()
      });
    }

    const response = NextResponse.json({
      ok: true,
      message: `Your PulseTap product is active. NFC and QR traffic will now open the destination URL.${accountMessage}`,
      card: {
        id: activatedCard.id,
        redirectUrl: activatedCard.redirectUrl,
        type: activatedCard.type
      }
    });

    response.cookies.set("pulsetap_user_id", userId, {
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
        message: "Activation failed. Try again in a moment."
      },
      { status: 500 }
    );
  }
}
