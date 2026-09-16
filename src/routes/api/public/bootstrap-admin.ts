import { createFileRoute } from "@tanstack/react-router";

/**
 * Membuat akun pengelola sekali saja dari kredensial yang tersimpan aman.
 * Pemanggil wajib mengirim header x-bootstrap-secret yang cocok dengan sandi pengelola.
 */
export const Route = createFileRoute("/api/public/bootstrap-admin")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const email = process.env["ADMIN_EMAIL"];
        const password = process.env["ADMIN_PASSWORD"];
        if (!email || !password) {
          return new Response("Not configured", { status: 500 });
        }
        if (request.headers.get("x-bootstrap-secret") !== password) {
          return new Response("Unauthorized", { status: 401 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        let userId: string | null = null;
        const created = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
        if (created.data.user) {
          userId = created.data.user.id;
        } else {
          const list = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
          userId = list.data.users.find((u) => u.email === email)?.id ?? null;
        }
        if (!userId) return new Response("Gagal menyiapkan akun", { status: 500 });

        await supabaseAdmin
          .from("user_roles")
          .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });

        return Response.json({ ok: true, created: Boolean(created.data.user) });
      },
    },
  },
});
