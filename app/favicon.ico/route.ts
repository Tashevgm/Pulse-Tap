export function GET(request: Request) {
  return Response.redirect(new URL("/images/pulsetap-logo.png", request.url), 308);
}
