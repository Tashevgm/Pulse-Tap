import { NextResponse } from "next/server";
import { resolveDynamicQrCode } from "@/lib/dynamic-qr";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const { slug } = await context.params;
    const destinationUrl = await resolveDynamicQrCode(slug);

    if (!destinationUrl) {
      return NextResponse.redirect(new URL("/tools/qr?missing=1", request.url), 302);
    }

    return NextResponse.redirect(destinationUrl, 302);
  } catch {
    return NextResponse.redirect(new URL("/tools/qr?unavailable=1", request.url), 302);
  }
}
