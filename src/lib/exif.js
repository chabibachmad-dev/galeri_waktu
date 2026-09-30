import { parse as parseExif } from "exifr";

// Ambil tanggal+jam foto diambil dari metadata EXIF ("DateTimeOriginal",
// dengan "CreateDate" sebagai cadangan kedua -- beberapa kamera/HP cuma
// mengisi salah satunya). Kalau filenya tidak punya EXIF sama sekali (PNG,
// screenshot, atau JPEG hasil edit yang metadatanya kehapus), fallback ke
// `file.lastModified` (waktu file terakhir diubah/dibuat di perangkat),
// dan kalau itu pun tidak masuk akal, pakai waktu sekarang.
export async function getPhotoDateTaken(file) {
  try {
    const data = await parseExif(file, ["DateTimeOriginal", "CreateDate"]);
    const taken = data?.DateTimeOriginal || data?.CreateDate;
    if (taken instanceof Date && !isNaN(taken.getTime())) {
      return taken;
    }
  } catch (_err) {
    // File tanpa EXIF (mis. PNG) sering bikin exifr melempar error -- itu
    // normal, bukan bug, tinggal lanjut ke fallback di bawah.
  }

  if (file.lastModified) {
    const fromFile = new Date(file.lastModified);
    if (!isNaN(fromFile.getTime())) return fromFile;
  }

  return new Date();
}
