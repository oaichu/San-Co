"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Nav";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await fetch(`/api/${mode === "login" ? "login" : "register"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const d = await r.json();
    setBusy(false);
    if (!r.ok) return setError(d.error ?? "Có lỗi xảy ra.");
    router.push("/online");
    router.refresh();
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 flex justify-center"><Logo /></div>
        <div className="rounded-2xl border border-line bg-surface p-7 shadow-lift">
          <h1 className="font-display text-[22px] font-bold tracking-[-0.02em]">
            {mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}
          </h1>
          <p className="mt-1 text-[13px] text-ink-2">
            {mode === "login" ? "Vào sân đấu online và giữ rating của bạn." : "Miễn phí, chỉ cần tên và mật khẩu."}
          </p>
          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="u" className="mb-1.5 block text-[12px] font-semibold text-ink-2">Tên đăng nhập</label>
              <input
                id="u" name="username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required
                className="w-full rounded-lg border border-line-2 bg-canvas px-3.5 py-2.5 text-[16px] outline-none transition-colors focus:border-vermilion md:text-[14px]"
              />
            </div>
            <div>
              <label htmlFor="p" className="mb-1.5 block text-[12px] font-semibold text-ink-2">Mật khẩu</label>
              <input
                id="p" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={6}
                className="w-full rounded-lg border border-line-2 bg-canvas px-3.5 py-2.5 text-[16px] outline-none transition-colors focus:border-vermilion md:text-[14px]"
              />
            </div>
            {error && <p className="text-[13px] font-medium text-vermilion" role="alert">{error}</p>}
            <button
              type="submit" disabled={busy}
              className="w-full rounded-xl bg-vermilion py-3 text-[14.5px] font-semibold text-accent-ink transition-transform duration-150 enabled:hover:-translate-y-0.5 enabled:active:scale-[0.97] disabled:opacity-50"
            >
              {busy ? "Đang xử lý…" : mode === "login" ? "Đăng nhập" : "Đăng ký"}
            </button>
          </form>
          <div className="mt-5 border-t border-line pt-4 text-center text-[13px] text-ink-2">
            {mode === "login" ? (
              <>Chưa có tài khoản? <button onClick={() => setMode("register")} className="font-semibold text-vermilion underline-offset-4 hover:underline">Đăng ký</button></>
            ) : (
              <>Đã có tài khoản? <button onClick={() => setMode("login")} className="font-semibold text-vermilion underline-offset-4 hover:underline">Đăng nhập</button></>
            )}
          </div>
        </div>
        <p className="mt-6 text-center text-[12.5px] text-ink-3"><Link href="/" className="hover:text-ink">← Về trang chủ</Link></p>
      </div>
    </main>
  );
}
