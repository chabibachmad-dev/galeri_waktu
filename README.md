# Galeri Waktu 📷

PWA galeri foto pribadi berbasis **timeline**:

1. Layar awal minta **kode akses** (bukan akun per-orang) -- siapa saja yang tahu kodenya bisa buka galerinya, cocok buat dipakai bareng keluarga/pasangan.
2. Upload foto langsung dari HP/komputer. Tanggal "diambil" dibaca otomatis dari **metadata EXIF** foto (kalau ada); kalau tidak ada EXIF, dipakai tanggal file terakhir diubah, lalu fallback ke waktu upload.
3. Foto disimpan di **Google Drive** kamu sendiri lewat Google Apps Script -- Supabase cuma menyimpan link + judul + tanggalnya, bukan file gambarnya.
4. Tampilan **timeline**, foto dikelompokkan per bulan (terbaru di atas), tiap foto punya judul yang bisa diedit kapan saja.
5. Desain disamakan dengan project **ringkasan_harian**/**dompet_harian**: murni hitam/putih, font monospace, gaya "Snail OS".

Database-nya pakai **Supabase project yang sama** dengan ringkasan_harian/dompet_harian -- cuma tabelnya beda (`photos`), jadi tidak menyentuh tabel lain yang sudah ada di sana.

## Arsitektur singkat

```
PWA (GitHub Pages, repo baru "galeri_waktu")
   │
   ├── Kode akses global (BUKAN akun per-orang)
   │      disimpan di localStorage browser setelah berhasil masuk,
   │      divalidasi ulang ke server tiap kali app dibuka
   │
   ├── Supabase Edge Function "gallery"  <-- satu-satunya pintu ke database
   │      tiap request WAJIB sertakan kode akses, dicek server-side
   │      SEBELUM menyentuh tabel apa pun
   │      │
   │      └── Supabase Postgres (tabel `photos`)
   │             RLS aktif TANPA policy sama sekali (dikunci total dari
   │             anon key) -- cuma Edge Function (pakai service_role)
   │             yang bisa baca/tulis
   │
   └── Google Apps Script (Web App, jalan di akun Google kamu sendiri)
          menerima foto (base64) dari browser → simpan ke folder Drive
          kamu → ubah permission jadi "siapa saja yang punya link" →
          balikin link thumbnail-nya → link itu yang disimpan ke kolom
          photos.drive_url
```

**Kenapa lewat Edge Function, bukan langsung dari browser ke Supabase kayak dompet_harian?** Di dompet_harian tiap orang beneran punya akun sendiri (Supabase Auth + RLS per `user_id`), jadi aman diakses langsung. Di sini tidak ada sistem akun -- cuma satu kode akses bersama -- jadi kalau tabel `photos` dibuka langsung ke anon key, siapa pun bisa baca/tulis tanpa perlu tahu kodenya sama sekali. Makanya tabelnya dikunci total, dan satu-satunya jalan masuk adalah Edge Function yang mengecek kode akses lebih dulu.

**Kenapa tidak ada tabel `access_codes` di database?** Supaya kode akses tidak pernah terkirim ke browser dalam bentuk apa pun yang bisa dibaca (kalau disimpan di tabel yang bisa di-query dari anon key, siapa pun bisa lihat daftar kode yang valid). Kode aksesnya disimpan sebagai **Supabase secret** (`GALLERY_ACCESS_CODE`) yang cuma bisa dibaca oleh Edge Function di server, lalu dibandingkan ke kode yang dikirim user. Efeknya sama seperti tabel `access_codes` (satu kode berlaku untuk semua), tapi jauh lebih aman.

---

## 0. Yang kamu butuhkan

- Repo GitHub **baru** bernama `galeri_waktu` (bukan repo ringkasan_harian/dompet_harian yang sudah ada) + GitHub Desktop untuk push.
- Project Supabase yang sama seperti ringkasan_harian/dompet_harian (URL & anon key sudah dipakai otomatis di kode ini).
- [Node.js](https://nodejs.org/) versi 20+ di komputer, untuk build.
- Akun Google (buat Apps Script) -- boleh pakai akun Google yang sama seperti biasa.
- [Supabase CLI](https://supabase.com/docs/guides/cli) terinstall (`npm install -g supabase`), untuk deploy Edge Function.

Salin semua file di folder ini ke folder lokal repo `galeri_waktu` kamu (yang sudah di-clone lewat GitHub Desktop), lalu ikuti langkah di bawah **sebelum** push ke GitHub.

---

## 1. Setup database Supabase

1. Buka [Supabase Dashboard](https://supabase.com/dashboard) → project kamu (yang sama dengan ringkasan_harian/dompet_harian) → **SQL Editor**.
2. Jalankan isi file `supabase/migrations/0001_gallery.sql` -- ini bikin tabel `photos` beserta RLS-nya (dikunci total, tanpa policy), **tidak** mengubah tabel lain yang sudah ada.

## 2. Tentukan kode akses & deploy Edge Function

1. Buka terminal di folder project ini, login ke Supabase CLI kalau belum: `npx supabase login`.
2. Hubungkan ke project kamu: `npx supabase link --project-ref <project-id-kamu>` (project ID ada di URL dashboard, atau di **Project Settings → General**).
3. Deploy function-nya: `npx supabase functions deploy gallery`.
4. Set kode akses sebagai secret (ganti `kode-rahasia-kamu` dengan kode pilihanmu sendiri, bebas -- angka, huruf, atau campuran):
   ```
   npx supabase secrets set GALLERY_ACCESS_CODE=kode-rahasia-kamu
   ```
   Kode ini yang nanti diminta di layar awal app. Simpan baik-baik / bagikan cuma ke orang yang boleh akses galerinya.

## 3. Setup Google Apps Script (upload foto ke Drive)

1. Di Google Drive kamu, buat folder baru khusus buat nyimpen foto galeri (misal namanya "Galeri Waktu"). Buka folder itu, salin **ID folder**-nya dari URL address bar:
   ```
   https://drive.google.com/drive/folders/1AbCDEfGhIjKlMnOpQrStUvWxYz
                                            ^^^^^^^^^^^^^^^^^^^^^^^^^^^ ini ID-nya
   ```
2. Buka https://script.google.com → **New project**.
3. Hapus semua isi default `Code.gs`, tempel isi file `gas/Code.gs` dari folder ini.
4. Cari baris `const FOLDER_ID = "GANTI_DENGAN_ID_FOLDER_DRIVE_KAMU";`, ganti dengan ID folder dari langkah 1.
5. (Opsional tapi disarankan) Ganti nama project-nya jadi "Galeri Waktu Upload" lewat judul di pojok kiri atas, biar gampang dikenali nanti.
6. Klik **Deploy → New deployment**.
   - Klik ikon gerigi di sebelah "Select type" → pilih **Web app**.
   - **Execute as**: `Me` (akun Google kamu).
   - **Who has access**: `Anyone`.
   - Klik **Deploy**. Google mungkin minta kamu login ulang & konfirmasi izin akses Drive -- izinkan.
7. Setelah deploy selesai, salin **Web app URL**-nya (formatnya `https://script.google.com/macros/s/xxxxx/exec`). Ini yang dipakai sebagai `VITE_GAS_UPLOAD_URL` di langkah 4.

**Catatan privasi**, penting dibaca: supaya foto bisa langsung tampil sebagai gambar di timeline tanpa perlu login Google berulang kali, script ini otomatis men-share tiap file yang diupload sebagai "Anyone with the link can view". Artinya file itu tidak 100% privat seperti file Drive biasa -- siapa pun yang entah bagaimana tahu link persis file itu bisa membukanya. Link-nya sendiri acak & panjang (tidak disebar ke mana-mana), jadi risikonya rendah untuk pemakaian pribadi/keluarga, tapi tetap perlu kamu sadari.

**Kalau nanti kamu edit `Code.gs` lagi** (misal ganti folder tujuan): buka lagi project script-nya → **Deploy → Manage deployments** → klik ikon pensil di deployment yang ada → ubah **Version** ke "New version" → **Deploy**. Dengan cara ini URL `/exec`-nya tetap sama, tidak perlu update `.env`/secret lagi. Kalau kamu malah bikin "New deployment" baru (bukan edit yang lama), URL-nya akan beda dan harus diupdate ulang di `.env` + GitHub secret.

## 4. Konfigurasi frontend

1. Salin `.env.example` menjadi `.env`.
2. Isi `VITE_GAS_UPLOAD_URL` dengan Web app URL dari langkah 3 (`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` sudah otomatis terisi sama seperti ringkasan_harian/dompet_harian, karena memang project Supabase yang sama). Kode akses **tidak** disimpan di `.env` -- itu di-set sebagai Supabase secret di langkah 2.
3. Test lokal kalau mau: `npm install` lalu `npm run dev`, buka `http://localhost:5173`, masukkan kode akses yang kamu set di langkah 2.

## 5. Push ke GitHub & deploy ke GitHub Pages

1. Buat repo GitHub baru bernama `galeri_waktu` (kalau belum ada), clone lewat GitHub Desktop, taruh semua file dari folder ini di situ.
2. Commit semua file, push ke `main`.
3. Di GitHub.com, buka repo → **Settings → Pages** → bagian **Build and deployment**, pilih Source: **GitHub Actions**.
4. Buka **Settings → Secrets and variables → Actions → New repository secret**, tambahkan 3 secret ini (nilainya sama seperti isi `.env` kamu):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_GAS_UPLOAD_URL`
5. Push commit apa saja ke `main` (atau buka tab **Actions** → jalankan workflow "Deploy PWA ke GitHub Pages" secara manual) untuk memicu deploy pertama.
6. Setelah selesai (cek tab **Actions**), URL PWA kamu ada di **Settings → Pages**, biasanya `https://<username>.github.io/galeri_waktu/`.

## 6. Install & mulai pakai di HP

1. Buka URL GitHub Pages kamu di browser HP.
2. (Opsional, biar terasa seperti app asli) Tambahkan ke Layar Utama: di Safari (iPhone) lewat tombol Share → "Add to Home Screen"; di Chrome (Android) lewat menu → "Add to Home screen" / "Install app".
3. Masukkan kode akses yang kamu set di langkah 2.
4. Tap tombol "+" di kanan bawah untuk upload foto pertama. Bisa pilih beberapa foto sekaligus -- tiap foto otomatis dibaca tanggal EXIF-nya dan diberi judul awal dari nama filenya (bisa diedit kapan saja lewat ikon pensil di tiap foto).

---

## Kalau foto muncul ikon gambar rusak (broken image)

`gas/Code.gs` di project ini **sudah** pakai `drive.google.com/thumbnail?id=...&sz=w2000` sejak awal (bukan `uc?export=view` yang dimatikan Google untuk hotlink `<img>` sejak 2024 -- ini pelajaran dari bug yang sempat kejadian di dompet_harian). Kalau tetap muncul gambar rusak, kemungkinan penyebabnya:

1. File di Google Drive kebetulan belum/tidak ter-share "Anyone with the link" (cek manual lewat Drive, klik kanan file → Share).
2. Deployment Apps Script kamu memakai versi `Code.gs` yang lama. Buka lagi https://script.google.com, pastikan isi `Code.gs` sudah sama persis dengan file di folder ini, lalu **Deploy → Manage deployments** → edit deployment yang ada → Version: **New version** → **Deploy**.
3. Kalau ada foto lama yang sempat tersimpan dengan link format lain, perbaiki lewat SQL Editor Supabase (aman diulang, baris yang sudah benar otomatis tidak match):
   ```sql
   update public.photos
   set drive_url = 'https://drive.google.com/thumbnail?id=' || drive_file_id || '&sz=w2000'
   where drive_url like '%uc?export=view%';
   ```

## Catatan keamanan & privasi

- Kode akses **tidak pernah** terkirim ke browser dalam bentuk yang bisa dibaca -- disimpan sebagai Supabase secret (`GALLERY_ACCESS_CODE`) yang cuma dicek server-side di Edge Function. Browser cuma menyimpan kode yang **kamu ketik sendiri** di localStorage, supaya tidak perlu login ulang tiap buka app.
- Tabel `photos` dikunci total (Row Level Security aktif tanpa policy sama sekali) -- tidak ada satu pun cara buat anon key langsung baca/tulis tabel ini. Satu-satunya jalan masuk adalah Edge Function `gallery`, yang mengecek kode akses dulu di setiap request.
- Foto di Google Drive di-share sebagai "anyone with the link can view" (lihat catatan privasi di langkah 3) supaya bisa auto-preview di timeline.
- URL Web App Google Apps Script diset "Anyone" bisa memanggilnya (bukan cuma kamu yang login) -- ini supaya frontend bisa langsung upload tanpa perlu proses login Google terpisah tiap upload foto. Konsekuensinya: siapa pun yang entah bagaimana tahu persis URL `/exec` itu secara teknis bisa memakainya untuk upload file ke folder Drive kamu. Untuk pemakaian pribadi (URL tidak pernah disebar/dipublikasikan) risikonya kecil, tapi tetap perlu kamu sadari -- jangan taruh URL itu di tempat publik.
- Kalau kode akses bocor/mau diganti, cukup jalankan ulang `npx supabase secrets set GALLERY_ACCESS_CODE=kode-baru` -- tidak perlu redeploy apa pun, berlaku langsung di request berikutnya. Orang yang masih pakai kode lama otomatis diminta masuk ulang.

## Batasan yang perlu diketahui

- Semua foto diambil sekaligus tiap kali timeline dimuat (tidak ada paginasi) -- cukup untuk koleksi pribadi/keluarga biasa, tapi kalau suatu saat jumlah fotonya jadi sangat banyak (ribuan), bisa ditambahkan query berpaginasi per bulan.
- Foto dikompres di sisi browser sebelum diupload (maksimal 2400px sisi terpanjang, kualitas JPEG 88%) supaya upload dari HP tidak lambat dan tidak kena limit ukuran request Google Apps Script -- file asli yang tersimpan di Drive sudah bentuk terkompresi ini, bukan file original 1:1.
- Aplikasi ini sengaja dibuat satu bahasa (Indonesia) tanpa toggle ID/EN, supaya lebih ringkas -- gampang ditambahkan belakangan kalau ternyata dibutuhkan.
- Tidak ada fitur hapus banyak foto sekaligus (bulk delete) atau download semua foto -- foto aslinya tetap ada & bisa dikelola langsung dari Google Drive kamu kapan saja.
