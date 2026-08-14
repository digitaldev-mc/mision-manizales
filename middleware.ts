import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const FINANZAS_ROUTES = ["/admin/donaciones", "/admin/pedidos"];
const CONTENIDO_ROUTES = ["/admin/contenido", "/admin/productos", "/admin/termometro"];

function withSecurityHeaders(response: NextResponse) {
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.paypal.com https://www.sandbox.paypal.com; frame-src https://www.paypal.com https://www.sandbox.paypal.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;",
  );
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (request.headers.get("x-forwarded-proto") === "http") {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    });

    if (!token) {
      return withSecurityHeaders(NextResponse.redirect(new URL("/admin/login", request.url)));
    }

    const role = token.role as string | undefined;
    if (role === "CONTENIDO" && FINANZAS_ROUTES.some((r) => pathname.startsWith(r))) {
      return withSecurityHeaders(NextResponse.redirect(new URL("/admin", request.url)));
    }
    if (role === "FINANZAS" && CONTENIDO_ROUTES.some((r) => pathname.startsWith(r))) {
      return withSecurityHeaders(NextResponse.redirect(new URL("/admin", request.url)));
    }
  }

  return withSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
