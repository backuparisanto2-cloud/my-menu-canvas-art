import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Masuk Pengelola — Menu Kantin Inyong" },
      { name: "description", content: "Halaman masuk pengelola menu Umaeh Inyong Purwokerto." },
      { property: "og:title", content: "Masuk Pengelola — Menu Kantin Inyong" },
      { property: "og:description", content: "Akses khusus pengelola menu Umaeh Inyong." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (err) {
      setError("Email atau sandi salah.");
      return;
    }
    void navigate({ to: "/admin" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#faf5ea] px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg"
      >
        <h1 className="text-lg font-bold text-[#5a3521]">Masuk Pengelola</h1>
        <p className="mt-1 text-xs text-[#5a3521]/70">Kelola halaman menu Kantin Inyong.</p>

        <label className="mt-5 block text-xs font-semibold text-[#5a3521]">Email</label>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[#5a3521]/20 px-3 py-2 text-sm"
        />

        <label className="mt-3 block text-xs font-semibold text-[#5a3521]">Sandi</label>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[#5a3521]/20 px-3 py-2 text-sm"
        />

        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-5 w-full rounded-full bg-[#5a3521] py-2.5 text-sm font-semibold text-[#faf5ea] disabled:opacity-60"
        >
          {busy ? "Memproses…" : "Masuk"}
        </button>
      </form>
    </div>
  );
}
