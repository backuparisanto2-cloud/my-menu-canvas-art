import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import type { MenuPage } from "@/data/menu-pages";

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/** Daftar halaman menu untuk halaman publik (urut sesuai posisi). */
export const getMenuPages = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data, error } = await supabase
    .from("menu_pages")
    .select("id, slug, title, subtitle, image_url, position")
    .order("position", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map<MenuPage>((row) => ({
    id: row.slug,
    title: row.title,
    subtitle: row.subtitle,
    url: row.image_url,
  }));
});

/** Nomor versi build saat ini. */
export const getSiteVersion = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = publicClient();
  const { data } = await supabase.from("site_version").select("version").maybeSingle();
  return data?.version ?? 1;
});
