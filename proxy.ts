import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only (is there a session cookie?). The real admin check
// happens in the page and in every staff action via requireAdmin().
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isStaffArea = pathname === "/staff" || pathname.startsWith("/staff/");
  const isLogin = pathname === "/staff/login";

  if (isStaffArea && !isLogin && !getSessionCookie(request)) {
    return NextResponse.redirect(new URL("/staff/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/staff/:path*"],
};
