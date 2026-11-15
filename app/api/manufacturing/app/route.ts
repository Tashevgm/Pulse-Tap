export const dynamic = "force-dynamic";

export async function GET() {
  return new Response("NFC programming access is available by enquiry only. Contact info@pulse-tap.com.", {
    status: 403,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" }
  });
}
