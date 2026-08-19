import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PAYMENT_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.paypal.com https://www.sandbox.paypal.com https://www.paypalobjects.com https://checkout.bold.co https://static.cloudflareinsights.com",
  "connect-src 'self' https://cloudflareinsights.com https://www.paypal.com https://www.sandbox.paypal.com https://www.paypalobjects.com https://api.paypal.com https://api-m.paypal.com https://api.sandbox.paypal.com https://api-m.sandbox.paypal.com https://checkout.bold.co https://integrations.api.bold.co https://*.bold.co",
  "frame-src 'self' https://www.paypal.com https://www.sandbox.paypal.com https://checkout.bold.co https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://www.instagram.com",
  "img-src 'self' data: https: blob:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.paypal.com https://www.paypalobjects.com",
  "font-src 'self' https://fonts.gstatic.com",
].join("; ");

function withSecurityHeaders(response: NextResponse) {
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Content-Security-Policy", PAYMENT_CSP);
  return response;
}

export async function middleware(request: NextRequest) {
  if (request.headers.get("x-forwarded-proto") === "http") {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url);
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets|api).*)"],
};
