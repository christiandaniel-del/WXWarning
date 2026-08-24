"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "register" ? { email, password, displayName } : { email, password }
        ),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.message ?? `Gagal (${res.status})`);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Koneksi gagal — coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">◼ WXWarning</h1>
          <p className="mt-1 text-sm text-muted">
            Aviation hazard dashboard · pilot & dispatcher
          </p>
        </div>

        <form
          onSubmit={submit}
          className="rounded-[var(--radius-card)] border border-edge bg-elevated p-6"
        >
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-lg border border-edge p-1 text-sm">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMode(m);
                  setError("");
                }}
                className={
                  mode === m
                    ? "rounded-md bg-raised px-3 py-1.5 font-medium text-ink"
                    : "px-3 py-1.5 text-muted hover:text-ink"
                }
              >
                {m === "login" ? "Masuk" : "Daftar"}
              </button>
            ))}
          </div>

          {mode === "register" && (
            <label className="mb-4 block text-sm">
              <span className="mb-1.5 block text-muted">Nama</span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nama tampilan"
                className="w-full rounded-lg border border-edge bg-base px-3 py-2 text-ink outline-none focus:border-info"
              />
            </label>
          )}

          <label className="mb-4 block text-sm">
            <span className="mb-1.5 block text-muted">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@maskapai.id"
              className="w-full rounded-lg border border-edge bg-base px-3 py-2 text-ink outline-none focus:border-info"
            />
          </label>

          <label className="mb-5 block text-sm">
            <span className="mb-1.5 block text-muted">Password</span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="min. 8 karakter"
              className="w-full rounded-lg border border-edge bg-base px-3 py-2 text-ink outline-none focus:border-info"
            />
          </label>

          {error && (
            <p className="mb-4 rounded-lg border border-extreme/40 bg-extreme/10 px-3 py-2 text-xs text-extreme">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-info px-3 py-2.5 text-sm font-medium text-white hover:bg-info/90 disabled:opacity-50"
          >
            {busy ? "Memproses…" : mode === "login" ? "Masuk" : "Daftar & Masuk"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          Alat bantu situational awareness — briefing resmi tetap otoritatif.
        </p>
      </div>
    </div>
  );
}
