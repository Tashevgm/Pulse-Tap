import { NextResponse } from "next/server";
import { updateCardRedirect } from "@/lib/card-repository";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
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
