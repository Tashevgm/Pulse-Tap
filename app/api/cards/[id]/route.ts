import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { findCardById, updateCardRedirect } from "@/lib/card-repository";
import { getCurrentProfile } from "@/lib/user-repository";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const cookieStore = await cookies();
    const profile = await getCurrentProfile(cookieStore.get("pulsetap_user_id")?.value);

    if (!profile) {
      return NextResponse.json(
        {
          ok: false,
          message: "Sign in to update this product."
        },
        { status: 401 }
      );
    }

    const card = await findCardById(id);

    if (!card) {
      return NextResponse.json(
        {
          ok: false,
          message: "Card not found."
        },
        { status: 404 }
      );
    }

    if (card.ownerUserId !== profile.id) {
      return NextResponse.json(
        {
          ok: false,
          message: "This product is not connected to your profile."
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as {
      redirectUrl?: string;
    };

    const updatedCard = await updateCardRedirect(id, body.redirectUrl ?? "");

    if (!updatedCard) {
      return NextResponse.json(
        {
          ok: false,
          message: "Card not found."
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      card: updatedCard
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "Could not update this product."
      },
      { status: 500 }
    );
  }
}
