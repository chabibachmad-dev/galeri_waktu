import { useEffect, useState } from "react";
import { IconX, IconDownload } from "../icons.jsx";
import { formatDateShort } from "../lib/format.js";

function slugify(text) {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function PhotoLightbox({ photo, onClose }) {
  const [downloading, setDownloading] = useState(false);
  const [downloadHint, setDownloadHint] = useState("");

  // Tutup pakai tombol Escape, dan reset status tiap ganti foto.
  useEffect(() => {
    if (!photo) return;
    setDownloadHint("");
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [photo, onClose]);

  if (!photo) return null;

  async function handleDownload() {
    setDownloading(true);
    setDownloadHint("");
    try {
      const res = await fetch(photo.drive_url);
      if (!res.ok) throw new Error("fetch gagal");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${slugify(photo.title) || "foto"}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (_err) {
      // Google Drive kadang tidak izinkan fetch lintas-origin dari browser
      // (CORS) -- fallback: buka foto di tab baru, tinggal tekan & tahan
      // gambarnya buat simpan manual ke galeri.
      window.open(photo.drive_url, "_blank", "noopener");
      setDownloadHint("Kalau unduhan tidak otomatis mulai: tekan & tahan gambar yang terbuka, lalu pilih \"Simpan ke Foto/Galeri\".");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      <div className="relative w-full max-w-lg max-h-full flex flex-col bg-bg-card border border-line rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={onClose}
          title="Tutup"
          aria-label="Tutup"
          className="absolute top-2.5 right-2.5 z-10 w-9 h-9 rounded-full border border-line bg-bg text-ink flex items-center justify-center"
        >
          <IconX />
        </button>

        <div className="w-full bg-bg flex items-center justify-center" style={{ maxHeight: "70vh" }}>
          <img
            src={photo.drive_url}
            alt={photo.title}
            className="w-full h-full object-contain"
            style={{ maxHeight: "70vh" }}
          />
        </div>

        <div className="p-4 flex flex-col gap-3">
          <div>
            <p className="text-sm font-bold break-words">{photo.title}</p>
            <p className="text-xs text-muted mt-0.5">{formatDateShort(photo.taken_at)}</p>
          </div>

          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="w-full py-2.5 rounded-lg border-[1.5px] border-ink bg-accent text-accent-contrast font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <IconDownload />
            {downloading ? "Menyiapkan unduhan..." : "Download ke Galeri"}
          </button>

          {downloadHint ? <p className="text-xs text-muted">{downloadHint}</p> : null}
        </div>
      </div>
    </div>
  );
}
