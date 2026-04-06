import { NextRequest, NextResponse } from "next/server";

// Routes that do not require authentication
const PUBLIC_PATHS = ["/api/health", "/login", "/api/auth/login", "/api/auth/logout"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublic = PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  if (isPublic) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get("dashboard_auth");
  const password = process.env.DASHBOARD_PASSWORD;

  if (!password || authCookie?.value !== password) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
