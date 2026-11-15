import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = decodeURIComponent(request.nextUrl.pathname);
  if (pathname.startsWith("/downloads/") && pathname !== "/downloads/pulsetap-nfc-bridge-windows.zip" && pathname !== "/downloads/PulseTap NFC Bridge" && !pathname.startsWith("/downloads/PulseTap NFC Bridge/")) {
    return NextResponse.next();
  }
  return new NextResponse("NFC programming access is available by enquiry only. Contact info@pulse-tap.com.", {
    status: 403,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
  });
}

export const config = {
  matcher: ["/manufacturing/:path*", "/downloads/:path*"]
};
