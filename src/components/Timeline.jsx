import { useEffect, useState, useCallback, useMemo } from "react";
import PhotoCard from "./PhotoCard.jsx";
import PhotoLightbox from "./PhotoLightbox.jsx";
import { IconPhoto, IconClock } from "../icons.jsx";
import { fetchPhotos, updatePhotoTitle, deletePhoto } from "../lib/gallery.js";
import { formatMonthHeading } from "../lib/format.js";

export default function Timeline({ accessCode, refreshTick }) {
  const [status, setStatus] = useState("loading"); // loading | error | ready
  const [photos, setPhotos] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  const load = useCallback(async () => {
    if (!accessCode) return;
    setStatus((s) => (s === "ready" ? "ready" : "loading"));
    const result = await fetchPhotos(accessCode);
    if (!result.ok) {
      setErrorMsg(result.message || "Gagal memuat foto.");
      setStatus("error");
      return;
    }
    setPhotos(result.photos || []);
    setStatus("ready");
  }, [accessCode]);

  useEffect(() => {
    load();
  }, [load, refreshTick]);

  const handleUpdateTitle = useCallback(
    async (id, title) => {
      const result = await updatePhotoTitle(accessCode, id, title);
      if (!result.ok) {
        window.alert(result.message || "Gagal menyimpan judul.");
        return false;
      }
      setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, title: result.photo.title } : p)));
      return true;
    },
    [accessCode]
  );

  const handleDelete = useCallback(
    async (id) => {
      const result = await deletePhoto(accessCode, id);
      if (!result.ok) {
        window.alert(result.message || "Gagal menghapus foto.");
        return;
      }
      setPhotos((prev) => prev.filter((p) => p.id !== id));
    },
    [accessCode]
  );

  // Kelompokkan foto per bulan berdasarkan taken_at -- daftar `photos` dari
  // server sudah terurut taken_at desc, jadi tinggal jalan lurus & pecah
  // begitu label bulannya beda dari grup sebelumnya.
  const groups = useMemo(() => {
    const result = [];
    let current = null;
    for (const photo of photos) {
      const label = formatMonthHeading(photo.taken_at);
      if (!current || current.label !== label) {
        current = { label, items: [] };
        result.push(current);
      }
      current.items.push(photo);
    }
    return result;
  }, [photos]);

  if (status === "loading") {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-muted text-sm">
        Memuat foto...
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3 text-center px-4">
        <p className="text-sm font-bold">Gagal memuat galeri</p>
        <p className="text-muted text-sm max-w-xs">{errorMsg}</p>
        <button
          type="button"
          onClick={load}
          className="px-4 py-2 rounded-lg border border-line text-sm font-bold"
        >
          Coba lagi
        </button>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 gap-3 text-center px-4">
        <IconPhoto className="opacity-60" />
        <p className="text-sm font-bold">Belum ada foto</p>
        <p className="text-muted text-sm max-w-xs">
          Ketuk tombol + di bawah untuk mulai menambahkan foto ke galeri.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="py-5 flex flex-col gap-8 pb-28">
        {groups.map((group) => (
          <section key={group.label} className="flex flex-col gap-3">
            {/* top-0 cukup di sini -- area ini (.app-scroll di App.jsx) yang
                jadi konteks scroll-nya sendiri, Topbar sudah di luar area ini
                jadi tidak perlu lagi dikompensasi tinggi topbar-nya. */}
            <div className="flex items-center gap-2 text-sm font-bold text-muted sticky top-0 bg-bg py-1.5 -mx-1 px-1 z-[5]">
              <IconClock className="w-4 h-4 flex-shrink-0" />
              <h2 className="capitalize">{group.label}</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {group.items.map((photo) => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  accessCode={accessCode}
                  onUpdateTitle={handleUpdateTitle}
                  onDelete={handleDelete}
                  onOpenLightbox={setLightboxPhoto}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
      <PhotoLightbox photo={lightboxPhoto} onClose={() => setLightboxPhoto(null)} />
    </>
  );
}
