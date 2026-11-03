import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only: redirects visitors without a session cookie away from the
// admin area. Every admin page, server action and API route still verifies the
// session against the database (see src/lib/auth.ts).
const SESSION_COOKIE = "fd_session";

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname.startsWith("/admin/login")) return NextResponse.next();
  if (!request.cookies.get(SESSION_COOKIE)?.value) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
