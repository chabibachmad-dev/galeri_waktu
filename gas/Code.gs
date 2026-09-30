/**
 * Galeri Waktu -- Google Apps Script "backend" buat upload foto ke Google
 * Drive dari PWA (lewat browser HP/komputer).
 *
 * CARA PAKAI (lihat juga README.md bagian "Setup Google Apps Script"):
 *   1. Buka https://script.google.com -> New project.
 *   2. Hapus isi default Code.gs, tempel isi file ini.
 *   3. Ganti FOLDER_ID di bawah dengan ID folder Google Drive tujuan.
 *   4. Deploy -> New deployment -> pilih tipe "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 *   5. Salin URL deployment (diakhiri "/exec"), taruh di .env sebagai
 *      VITE_GAS_UPLOAD_URL.
 *
 * CATATAN PRIVASI: supaya foto bisa langsung ditampilkan di timeline tanpa
 * harus login Google dulu, file yang diupload lewat script ini otomatis
 * diset "Anyone with the link can view". Artinya siapa pun yang tahu/
 * menebak link filenya bisa lihat gambarnya -- link-nya sendiri tidak
 * ditaruh di tempat publik mana pun, tapi ini bukan private secara penuh
 * seperti file Drive biasa. Kalau kamu tidak nyaman dengan ini, bisa diubah
 * nanti -- tinggal bilang, konsekuensinya app tidak bisa auto-preview foto.
 *
 * CATATAN FORMAT LINK: pola lama "uc?export=view&id=..." yang dulu dipakai
 * di project dompet_harian ternyata dimatikan Google untuk hotlink <img>
 * sejak 2024 (selalu muncul ikon gambar rusak). Di sini dari awal sudah
 * pakai endpoint "thumbnail" yang memang didesain untuk kebutuhan ini.
 */

// TODO: ganti dengan ID folder Google Drive tujuan upload foto.
// ID folder = bagian di URL setelah "folders/", misal:
// https://drive.google.com/drive/folders/1AbCDEfGhIjKlMnOpQrStUvWxYz
//                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^ ini ID-nya
const FOLDER_ID = "GANTI_DENGAN_ID_FOLDER_DRIVE_KAMU";

// Ukuran gambar yang diminta lewat parameter "sz" -- w2000 artinya lebar
// maksimum 2000px (cukup tajam buat dilihat penuh layar, tapi Google yang
// generate versi terkecilnya secara otomatis, jadi tidak berat).
const THUMBNAIL_SIZE = "w2000";

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ ok: false, error: "Request kosong / tidak ada body." });
    }

    const body = JSON.parse(e.postData.contents);
    const filename = String(body.filename || `foto-${Date.now()}.jpg`);
    const mimeType = String(body.mimeType || "image/jpeg");
    const dataBase64 = body.dataBase64;

    if (!dataBase64) {
      return jsonResponse({ ok: false, error: "dataBase64 kosong." });
    }
    if (FOLDER_ID === "GANTI_DENGAN_ID_FOLDER_DRIVE_KAMU") {
      return jsonResponse({
        ok: false,
        error: "FOLDER_ID di Code.gs belum diganti -- lihat komentar di bagian atas file.",
      });
    }

    const folder = DriveApp.getFolderById(FOLDER_ID);
    const bytes = Utilities.base64Decode(dataBase64);
    const blob = Utilities.newBlob(bytes, mimeType, filename);
    const file = folder.createFile(blob);

    // Supaya link-nya bisa langsung dipakai sebagai <img src> di PWA tanpa
    // perlu login Google tiap buka -- lihat catatan privasi di atas.
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    const fileId = file.getId();
    const url = `https://drive.google.com/thumbnail?id=${fileId}&sz=${THUMBNAIL_SIZE}`;

    return jsonResponse({ ok: true, fileId, url });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function doGet() {
  // Cuma buat cek cepat lewat browser bahwa deployment-nya hidup.
  return jsonResponse({ ok: true, message: "Galeri Waktu upload endpoint aktif." });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
