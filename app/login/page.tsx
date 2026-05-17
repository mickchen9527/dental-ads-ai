"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setError("密码错误，请重试");
      return;
    }

    const next = new URLSearchParams(window.location.search).get("next");
    router.replace(next && next.startsWith("/") ? next : "/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-950">
      <section className="w-full max-w-md rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold text-cyan-700">内部系统</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal">
          口腔投放决策辅助系统
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          仅管理员可访问。本系统仅用于内部经营分析，不对外开放注册。
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            管理员密码
            <input
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="请输入管理员密码"
            />
          </label>

          {error ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
              {error}
            </p>
          ) : null}

          <button
            className="w-full rounded-md bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            type="submit"
            disabled={isSubmitting || password.length === 0}
          >
            {isSubmitting ? "登录中..." : "登录"}
          </button>
        </form>

        <p className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">
          当前系统不开放注册，不做多用户系统。广告预算、价格策略和医疗广告内容仍需人工确认。
        </p>
      </section>
    </main>
  );
}
