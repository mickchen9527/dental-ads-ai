import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, isValidAdminSession } from "@/lib/auth";

const publicFilePattern = /\.(.*)$/;
const publicPaths = new Set(["/login", "/api/login", "/api/logout"]);

function isPublicPath(pathname: string) {
  return (
    publicPaths.has(pathname) ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    publicFilePattern.test(pathname)
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoggedIn = await isValidAdminSession(
    request.cookies.get(AUTH_COOKIE_NAME)?.value,
  );

  if (pathname === "/login") {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
