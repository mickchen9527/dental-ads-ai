import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_MAX_AGE,
  AUTH_COOKIE_NAME,
  createAdminSessionToken,
} from "@/lib/auth";

export async function POST(request: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return NextResponse.json(
      { ok: false, message: "管理员密码未配置" },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { password?: string }
    | null;

  if (!body?.password || body.password !== adminPassword) {
    return NextResponse.json(
      { ok: false, message: "密码错误，请重试" },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(AUTH_COOKIE_NAME, await createAdminSessionToken(adminPassword), {
    httpOnly: true,
    maxAge: AUTH_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
