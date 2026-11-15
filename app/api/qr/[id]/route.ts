import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { deleteDynamicQrCode, dynamicQrPublicUrl, updateDynamicQrCode } from "@/lib/dynamic-qr";
import { getCurrentProfile } from "@/lib/user-repository";

type RouteContext = { params: Promise<{ id: string }> };

async function authenticatedProfile() {
  const cookieStore = await cookies();
  const profile = await getCurrentProfile(cookieStore.get("pulsetap_user_id")?.value);
  return profile?.isAuthenticated ? profile : null;
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const profile = await authenticatedProfile();
    if (!profile) {
      return NextResponse.json({ ok: false, message: "Log in to update dynamic QR codes." }, { status: 401 });
    }

    const { id } = await context.params;
    const body = (await request.json()) as { name?: string; destinationUrl?: string };
    const code = await updateDynamicQrCode({
      id,
      ownerProfileId: profile.id,
      name: body.name ?? "",
      destinationUrl: body.destinationUrl ?? ""
    });

    if (!code) {
      return NextResponse.json({ ok: false, message: "Dynamic QR code not found." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      code: {
        ...code,
        publicUrl: dynamicQrPublicUrl(code.slug, new URL(request.url).origin)
      }
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Could not update this QR code." },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const profile = await authenticatedProfile();
    if (!profile) {
      return NextResponse.json({ ok: false, message: "Log in to delete dynamic QR codes." }, { status: 401 });
    }

    const { id } = await context.params;
    const deleted = await deleteDynamicQrCode(id, profile.id);
    return deleted
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ ok: false, message: "Dynamic QR code not found." }, { status: 404 });
  } catch {
    return NextResponse.json({ ok: false, message: "Could not delete this QR code." }, { status: 400 });
  }
}
