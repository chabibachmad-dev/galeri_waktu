// Klien buat semua operasi galeri -- semua request lewat Edge Function
// `gallery` (lihat supabase/functions/gallery/index.ts), karena tabel
// `photos` dikunci total dari anon key (lihat migrations/0001_gallery.sql).

const CODE_STORAGE_KEY = "gw_access_code";

export function getStoredAccessCode() {
  try {
    return localStorage.getItem(CODE_STORAGE_KEY) || "";
  } catch (_err) {
    return "";
  }
}

export function setStoredAccessCode(code) {
  try {
    localStorage.setItem(CODE_STORAGE_KEY, code);
  } catch (_err) {
    // Abaikan (mis. private browsing yang blokir localStorage) -- kode
    // cuma tidak akan diingat lintas sesi, fitur tetap jalan.
  }
}

export function clearStoredAccessCode() {
  try {
    localStorage.removeItem(CODE_STORAGE_KEY);
  } catch (_err) {
    /* noop */
  }
}

async function callGalleryFunction(payload) {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/gallery`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.ok === false) {
      return {
        ok: false,
        unauthorized: res.status === 401,
        message: data.error || `HTTP ${res.status}`
      };
    }
    return { ok: true, ...data };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, unauthorized: false, message };
  }
}

export function verifyAccessCode(code) {
  return callGalleryFunction({ code, action: "verify" });
}

export function fetchPhotos(code) {
  return callGalleryFunction({ code, action: "list" });
}

export function createPhoto(code, { title, takenAt, driveUrl, driveFileId }) {
  return callGalleryFunction({
    code,
    action: "create",
    title,
    taken_at: takenAt,
    drive_url: driveUrl,
    drive_file_id: driveFileId
  });
}

export function updatePhotoTitle(code, id, title) {
  return callGalleryFunction({ code, action: "update", id, title });
}

export function deletePhoto(code, id) {
  return callGalleryFunction({ code, action: "delete", id });
}
