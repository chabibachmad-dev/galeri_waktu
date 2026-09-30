// Edge Function tunggal untuk semua operasi galeri foto: verifikasi kode
// akses, daftar foto, tambah foto baru, edit judul, hapus foto.
//
// Kenapa lewat Edge Function, bukan langsung dari browser ke Supabase?
// Tabel `photos` sengaja dikunci total dari anon key (RLS aktif tanpa
// policy sama sekali -- lihat migrations/0001_gallery.sql), karena galeri
// ini privat (dilindungi kode akses), bukan publik seperti ringkasan berita
// di ringkasan_harian. Function ini jalan pakai service_role (bisa baca/
// tulis tabel manapun) dan menolak semua request yang kode aksesnya salah
// SEBELUM menyentuh database sama sekali.
//
// Body request (semua action wajib sertakan "code"):
//   { "code": "...", "action": "verify" }
//     -> { ok: true }  (dipakai layar awal buat cek kode akses valid atau tidak)
//   { "code": "...", "action": "list" }
//     -> { ok: true, photos: [{ id, title, taken_at, drive_url, drive_file_id, created_at }, ...] }
//   { "code": "...", "action": "create", "title": "...", "taken_at": "ISO date", "drive_url": "...", "drive_file_id": "..." }
//     -> { ok: true, photo: {...} }
//   { "code": "...", "action": "update", "id": "...", "title": "..." }
//     -> { ok: true, photo: {...} }
//   { "code": "...", "action": "delete", "id": "..." }
//     -> { ok: true }

import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

const MAX_TITLE_LENGTH = 200;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

interface GalleryBody {
  code?: string;
  action?: string;
  id?: string;
  title?: string;
  taken_at?: string;
  drive_url?: string;
  drive_file_id?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" }, 405);
  }

  let body: GalleryBody;
  try {
    body = await req.json();
  } catch (_err) {
    return json({ ok: false, error: "Body harus JSON valid" }, 400);
  }

  const expectedCode = Deno.env.get("GALLERY_ACCESS_CODE");
  if (!expectedCode) {
    return json({ ok: false, error: "GALLERY_ACCESS_CODE belum di-set sebagai Supabase secret." }, 500);
  }
  if (typeof body.code !== "string" || body.code !== expectedCode) {
    return json({ ok: false, error: "Kode akses salah." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const db = createClient(supabaseUrl, serviceRoleKey);

  switch (body.action) {
    case "verify": {
      // Sampai sini kode sudah tervalidasi di atas -- cukup balikin ok.
      return json({ ok: true });
    }

    case "list": {
      const { data, error } = await db
        .from("photos")
        .select("id, title, taken_at, drive_url, drive_file_id, created_at")
        .order("taken_at", { ascending: false });
      if (error) return json({ ok: false, error: error.message }, 500);
      return json({ ok: true, photos: data ?? [] });
    }

    case "create": {
      if (typeof body.drive_url !== "string" || !body.drive_url) {
        return json({ ok: false, error: "drive_url wajib diisi." }, 400);
      }
      if (typeof body.drive_file_id !== "string" || !body.drive_file_id) {
        return json({ ok: false, error: "drive_file_id wajib diisi." }, 400);
      }
      const takenAt = typeof body.taken_at === "string" && body.taken_at ? body.taken_at : new Date().toISOString();
      const title = (typeof body.title === "string" ? body.title : "").trim().slice(0, MAX_TITLE_LENGTH) || "Tanpa judul";

      const { data, error } = await db
        .from("photos")
        .insert({ title, taken_at: takenAt, drive_url: body.drive_url, drive_file_id: body.drive_file_id })
        .select()
        .single();
      if (error) return json({ ok: false, error: error.message }, 500);
      return json({ ok: true, photo: data });
    }

    case "update": {
      if (typeof body.id !== "string" || !body.id) {
        return json({ ok: false, error: "id wajib diisi." }, 400);
      }
      const patch: Record<string, string> = {};
      if (typeof body.title === "string") {
        patch.title = body.title.trim().slice(0, MAX_TITLE_LENGTH) || "Tanpa judul";
      }
      if (typeof body.taken_at === "string" && body.taken_at) {
        patch.taken_at = body.taken_at;
      }
      if (Object.keys(patch).length === 0) {
        return json({ ok: false, error: "Tidak ada field untuk diupdate." }, 400);
      }

      const { data, error } = await db.from("photos").update(patch).eq("id", body.id).select().single();
      if (error) return json({ ok: false, error: error.message }, 500);
      return json({ ok: true, photo: data });
    }

    case "delete": {
      if (typeof body.id !== "string" || !body.id) {
        return json({ ok: false, error: "id wajib diisi." }, 400);
      }
      const { error } = await db.from("photos").delete().eq("id", body.id);
      if (error) return json({ ok: false, error: error.message }, 500);
      return json({ ok: true });
    }

    default:
      return json({ ok: false, error: `Action tidak dikenal: ${String(body.action)}` }, 400);
  }
});
