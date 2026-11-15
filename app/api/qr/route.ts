import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createDynamicQrCode, dynamicQrPublicUrl } from "@/lib/dynamic-qr";
import { getCurrentProfile } from "@/lib/user-repository";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const profile = await getCurrentProfile(cookieStore.get("pulsetap_user_id")?.value);

    if (!profile?.isAuthenticated) {
      return NextResponse.json({ ok: false, message: "Log in to create a dynamic QR code." }, { status: 401 });
    }

    const body = (await request.json()) as { name?: string; destinationUrl?: string };
    const code = await createDynamicQrCode({
      ownerProfileId: profile.id,
      name: body.name ?? "",
      destinationUrl: body.destinationUrl ?? ""
    });

    return NextResponse.json({
      ok: true,
      code: {
        ...code,
        publicUrl: dynamicQrPublicUrl(code.slug, new URL(request.url).origin)
      }
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Could not create this QR code." },
      { status: 400 }
    );
  }
}
