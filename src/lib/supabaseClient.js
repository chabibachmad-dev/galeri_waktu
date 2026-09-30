import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error(
    "VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum di-set. Salin .env.example jadi .env lalu isi nilainya."
  );
}

// Dipakai cuma untuk membaca url/anon key secara konsisten -- semua
// operasi tabel `photos` yang sebenarnya lewat Edge Function `gallery`
// (lihat src/lib/gallery.js), bukan lewat client ini langsung, karena
// tabelnya sengaja dikunci total dari anon key.
export const supabase = createClient(url, anonKey);
export const SUPABASE_URL = url;
export const SUPABASE_ANON_KEY = anonKey;
