-- Tabel untuk "Galeri Waktu" -- dibuat di Supabase project yang SAMA dengan
-- ringkasan_harian/dompet_harian, jadi sengaja tidak menyentuh tabel lain
-- yang sudah ada di sana.

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Tanpa judul',
  -- Tanggal+jam foto diambil (dari EXIF "DateTimeOriginal"), atau tanggal
  -- upload kalau foto tidak punya data EXIF -- lihat src/lib/exif.js.
  taken_at timestamptz not null,
  drive_url text not null,
  drive_file_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.photos.drive_url is
  'Link gambar di Google Drive (hasil upload lewat Google Apps Script, format drive.google.com/thumbnail?id=...) -- bukan file yang disimpan di Supabase.';
comment on column public.photos.taken_at is
  'Tanggal+jam foto diambil dari metadata EXIF, atau waktu upload sebagai fallback kalau EXIF tidak ada.';

create index if not exists photos_taken_at_idx on public.photos (taken_at desc);

-- RLS aktif TANPA satu pun policy -- artinya anon key (yang memang publik
-- ada di kode frontend) tidak bisa baca/tulis tabel ini sama sekali secara
-- langsung. Satu-satunya jalan masuk/keluar adalah Edge Function `gallery`
-- (lihat supabase/functions/gallery/index.ts), yang jalan pakai service_role
-- dan mewajibkan kode akses yang benar di tiap request. Pola ini sama persis
-- dengan tabel `chat_messages` di ringkasan_harian.
alter table public.photos enable row level security;

-- Kenapa tidak ada tabel "access_codes"? Menyimpan kode akses di tabel biasa
-- (meski RLS-nya dikunci) menambah satu lapis yang bisa salah konfigurasi
-- (misal ada policy yang kebuka tanpa sengaja). Karena cuma butuh SATU kode
-- global (bukan banyak kode per pengguna), cara paling sederhana & aman
-- adalah simpan sebagai Supabase secret (GALLERY_ACCESS_CODE) yang cuma bisa
-- dibaca oleh Edge Function di server -- persis seperti CHAT_ACCESS_CODE di
-- ringkasan_harian. Lihat README bagian "Setup Edge Function" untuk cara
-- set/ganti kodenya.

create or replace function public.set_photos_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_photos_updated_at on public.photos;
create trigger trg_photos_updated_at
  before update on public.photos
  for each row
  execute function public.set_photos_updated_at();
