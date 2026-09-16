import { createFileRoute } from "@tanstack/react-router";

/** Menyajikan gambar menu dari penyimpanan Cloud lewat alamat satu domain. */
export const Route = createFileRoute("/api/public/menu-image/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = params._splat;
        if (!path || path.includes("..")) return new Response("Not found", { status: 404 });

        const url = process.env["SUPABASE_URL"];
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
        if (!url || !key) return new Response("Not configured", { status: 500 });

        const res = await fetch(`${url}/storage/v1/object/menu-images/${path}`, {
          headers: { apikey: key },
        });
        if (!res.ok) return new Response("Not found", { status: 404 });

        return new Response(res.body, {
          headers: {
            "Content-Type": res.headers.get("content-type") ?? "image/webp",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
