import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Download, Image as ImageIcon, LogOut, Plus, Save, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { encodeMenuImage } from "@/lib/webp-encode";
import { downloadMenuZip } from "@/lib/export-menu-zip";
import type { MenuPage } from "@/data/menu-pages";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Kelola Menu — Kantin Inyong" },
      { name: "description", content: "Kelola halaman menu: tambah, ganti, hapus, dan urutkan." },
      { property: "og:title", content: "Kelola Menu — Kantin Inyong" },
      { property: "og:description", content: "Panel pengelola halaman menu Umaeh Inyong." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Row = {
  id: string;
  position: number;
  slug: string;
  title: string;
  subtitle: string;
  image_url: string;
  storage_path: string | null;
  bytes: number;
};

function slugify(value: string, fallback: string) {
  const s = value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || fallback;
}

function AdminPage() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [version, setVersion] = useState(1);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const addInput = useRef<HTMLInputElement | null>(null);
  const replaceFor = useRef<string | null>(null);
  const replaceInput = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    const [pages, ver] = await Promise.all([
      supabase
        .from("menu_pages")
        .select("id, position, slug, title, subtitle, image_url, storage_path, bytes")
        .order("position", { ascending: true }),
      supabase.from("site_version").select("version").maybeSingle(),
    ]);
    if (pages.data) setRows(pages.data as Row[]);
    if (ver.data) setVersion(ver.data.version);
  }, []);

  useEffect(() => {
    void (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", uid)
        .eq("role", "admin")
        .maybeSingle();
      const ok = Boolean(data);
      setIsAdmin(ok);
      if (ok) await load();
    })();
  }, [load]);

  async function uploadImage(file: File, slug: string) {
    const { blob, width, height } = await encodeMenuImage(file);
    const path = `${Date.now()}-${slug}.webp`;
    const { error } = await supabase.storage
      .from("menu-images")
      .upload(path, blob, { contentType: "image/webp", upsert: false });
    if (error) throw new Error(error.message);
    return { path, url: `/api/public/menu-image/${path}`, width, height, bytes: blob.size };
  }

  async function onAdd(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      let position = rows.length;
      for (const file of Array.from(files)) {
        position += 1;
        const base = slugify(file.name.replace(/\.[^.]+$/, ""), `halaman-${position}`);
        const slug = rows.some((r) => r.slug === base) ? `${base}-${position}` : base;
        const up = await uploadImage(file, slug);
        const { error } = await supabase.from("menu_pages").insert({
          position,
          slug,
          title: "Halaman baru",
          subtitle: "",
          image_url: up.url,
          storage_path: up.path,
          width: up.width,
          height: up.height,
          bytes: up.bytes,
        });
        if (error) throw new Error(error.message);
        setStatus(`${file.name} → ${Math.round(up.bytes / 1024)} KB WebP`);
      }
      await supabase.rpc("bump_site_version");
      await load();
      setStatus("Halaman ditambahkan dan diurutkan ulang.");
    } catch (err) {
      setStatus(`Gagal: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function onReplace(files: FileList | null) {
    const id = replaceFor.current;
    const file = files?.[0];
    if (!id || !file) return;
    const row = rows.find((r) => r.id === id);
    if (!row) return;
    setBusy(true);
    try {
      const up = await uploadImage(file, row.slug);
      const { error } = await supabase
        .from("menu_pages")
        .update({
          image_url: up.url,
          storage_path: up.path,
          width: up.width,
          height: up.height,
          bytes: up.bytes,
        })
        .eq("id", id);
      if (error) throw new Error(error.message);
      if (row.storage_path) await supabase.storage.from("menu-images").remove([row.storage_path]);
      await supabase.rpc("bump_site_version");
      await load();
      setStatus(`Gambar diganti (${Math.round(up.bytes / 1024)} KB WebP).`);
    } catch (err) {
      setStatus(`Gagal: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(row: Row) {
    if (!window.confirm(`Hapus halaman "${row.title}"?`)) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("menu_pages").delete().eq("id", row.id);
      if (error) throw new Error(error.message);
      if (row.storage_path) await supabase.storage.from("menu-images").remove([row.storage_path]);
      const rest = rows.filter((r) => r.id !== row.id);
      await supabase.rpc("reorder_menu_pages", { _ids: rest.map((r) => r.id) });
      await load();
      setStatus("Halaman dihapus dan nomor halaman diperbarui.");
    } catch (err) {
      setStatus(`Gagal: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  function move(index: number, dir: number) {
    const next = index + dir;
    if (next < 0 || next >= rows.length) return;
    const copy = [...rows];
    const a = copy[index]!;
    copy[index] = copy[next]!;
    copy[next] = a;
    setRows(copy);
  }

  async function onSave() {
    setBusy(true);
    try {
      for (const row of rows) {
        const { error } = await supabase
          .from("menu_pages")
          .update({ title: row.title, subtitle: row.subtitle })
          .eq("id", row.id);
        if (error) throw new Error(error.message);
      }
      const { error: rpcError } = await supabase.rpc("reorder_menu_pages", {
        _ids: rows.map((r) => r.id),
      });
      if (rpcError) throw new Error(rpcError.message);
      await load();
      setStatus("Perubahan disimpan, urutan diindeks ulang, versi build naik.");
    } catch (err) {
      setStatus(`Gagal: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function onZip() {
    setBusy(true);
    setStatus("Menyiapkan ZIP…");
    try {
      const pages: MenuPage[] = rows.map((r) => ({
        id: r.slug,
        title: r.title,
        subtitle: r.subtitle,
        url: r.image_url,
      }));
      await downloadMenuZip(pages, version);
      setStatus(`ZIP versi ${version} diunduh.`);
    } catch (err) {
      setStatus(`Gagal: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  if (isAdmin === null) {
    return <p className="p-6 text-center text-sm text-[#5a3521]">Memuat…</p>;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#faf5ea] px-6 text-center">
        <p className="text-sm text-[#5a3521]">Akun ini tidak punya akses pengelola.</p>
        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut();
            void navigate({ to: "/auth" });
          }}
          className="rounded-full bg-[#5a3521] px-4 py-2 text-xs font-semibold text-[#faf5ea]"
        >
          Keluar
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf5ea] pb-24">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-2 border-b border-[#5a3521]/15 bg-[#faf5ea]/95 px-4 py-3 backdrop-blur">
        <div>
          <h1 className="text-base font-bold text-[#5a3521]">Kelola Menu</h1>
          <p className="text-xs text-[#5a3521]/70">
            {rows.length} halaman · versi build {version}
          </p>
        </div>
        <button
          type="button"
          onClick={async () => {
            await supabase.auth.signOut();
            void navigate({ to: "/auth" });
          }}
          aria-label="Keluar"
          className="rounded-full bg-[#5a3521]/10 p-2 text-[#5a3521]"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => addInput.current?.click()}
            className="flex items-center gap-1.5 rounded-full bg-[#7ba428] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            <Plus className="h-4 w-4" /> Tambah halaman
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onSave()}
            className="flex items-center gap-1.5 rounded-full bg-[#5a3521] px-4 py-2 text-xs font-semibold text-[#faf5ea] disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> Simpan perubahan
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void onZip()}
            className="flex items-center gap-1.5 rounded-full bg-[#5a3521]/10 px-4 py-2 text-xs font-semibold text-[#5a3521] disabled:opacity-60"
          >
            <Download className="h-4 w-4" /> Unduh ZIP statis
          </button>
        </div>

        <input
          ref={addInput}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            void onAdd(e.target.files);
            e.target.value = "";
          }}
        />
        <input
          ref={replaceInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            void onReplace(e.target.files);
            e.target.value = "";
          }}
        />

        {status && (
          <p className="mt-3 rounded-lg bg-white px-3 py-2 text-xs text-[#5a3521] shadow-sm">
            {status}
          </p>
        )}

        <ul className="mt-4 flex flex-col gap-3">
          {rows.map((row, i) => (
            <li key={row.id} className="flex gap-3 rounded-2xl bg-white p-3 shadow-sm">
              <img
                src={row.image_url}
                alt={row.title}
                className="h-24 w-[68px] shrink-0 rounded-lg object-cover"
                loading="lazy"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-[#7ba428]">Halaman {i + 1}</p>
                <input
                  value={row.title}
                  onChange={(e) =>
                    setRows((rs) => rs.map((r) => (r.id === row.id ? { ...r, title: e.target.value } : r)))
                  }
                  placeholder="Judul"
                  className="mt-1 w-full rounded-md border border-[#5a3521]/15 px-2 py-1.5 text-sm font-semibold text-[#5a3521]"
                />
                <input
                  value={row.subtitle}
                  onChange={(e) =>
                    setRows((rs) =>
                      rs.map((r) => (r.id === row.id ? { ...r, subtitle: e.target.value } : r)),
                    )
                  }
                  placeholder="Keterangan"
                  className="mt-1.5 w-full rounded-md border border-[#5a3521]/15 px-2 py-1.5 text-xs text-[#5a3521]"
                />
                <p className="mt-1 text-[11px] text-[#5a3521]/60">
                  {Math.round(row.bytes / 1024) || "?"} KB · {row.slug}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    disabled={busy || i === 0}
                    onClick={() => move(i, -1)}
                    aria-label="Naikkan urutan"
                    className="rounded-full bg-[#5a3521]/10 p-1.5 text-[#5a3521] disabled:opacity-40"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={busy || i === rows.length - 1}
                    onClick={() => move(i, 1)}
                    aria-label="Turunkan urutan"
                    className="rounded-full bg-[#5a3521]/10 p-1.5 text-[#5a3521] disabled:opacity-40"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      replaceFor.current = row.id;
                      replaceInput.current?.click();
                    }}
                    className="flex items-center gap-1 rounded-full bg-[#5a3521]/10 px-3 py-1.5 text-[11px] font-semibold text-[#5a3521] disabled:opacity-40"
                  >
                    <ImageIcon className="h-3.5 w-3.5" /> Ganti gambar
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void onDelete(row)}
                    className="flex items-center gap-1 rounded-full bg-red-50 px-3 py-1.5 text-[11px] font-semibold text-red-600 disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Hapus
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
