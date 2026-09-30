import { useRef, useState } from "react";
import { IconPlus } from "../icons.jsx";
import { getPhotoDateTaken } from "../lib/exif.js";
import { uploadPhotoToDrive } from "../lib/drive.js";
import { createPhoto } from "../lib/gallery.js";

export default function UploadFab({ accessCode, onUploaded }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(null); // { done, total }
  const [errors, setErrors] = useState([]);

  function openPicker() {
    if (busy) return;
    setErrors([]);
    inputRef.current?.click();
  }

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // supaya bisa pilih file yang sama lagi nanti
    if (files.length === 0) return;

    setBusy(true);
    setProgress({ done: 0, total: files.length });
    const failedNames = [];

    for (const file of files) {
      try {
        const takenAt = await getPhotoDateTaken(file);
        const uploaded = await uploadPhotoToDrive(file);
        if (!uploaded.ok) {
          failedNames.push(`${file.name}: ${uploaded.error}`);
        } else {
          const title = file.name.replace(/\.[^/.]+$/, "") || "Tanpa judul";
          const created = await createPhoto(accessCode, {
            title,
            takenAt: takenAt.toISOString(),
            driveUrl: uploaded.url,
            driveFileId: uploaded.fileId
          });
          if (!created.ok) {
            failedNames.push(`${file.name}: ${created.message || "gagal disimpan ke database"}`);
          }
        }
      } catch (err) {
        failedNames.push(`${file.name}: ${err instanceof Error ? err.message : "gagal diunggah"}`);
      }
      setProgress((p) => (p ? { done: p.done + 1, total: p.total } : p));
    }

    setBusy(false);
    setProgress(null);
    setErrors(failedNames);
    onUploaded();
  }

  const pct = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="fixed bottom-5 inset-x-0 flex flex-col items-center gap-2 pointer-events-none px-4">
      {busy && progress ? (
        <div className="pointer-events-auto w-full max-w-xs bg-bg-card border border-line rounded-xl p-3 text-xs text-ink">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold">Mengunggah foto...</span>
            <span className="text-muted font-mono">{progress.done}/{progress.total}</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-soft border border-line overflow-hidden">
            <div
              className="h-full bg-ink"
              style={{ width: `${pct}%`, transition: "width 0.25s ease" }}
            />
          </div>
        </div>
      ) : null}

      {errors.length > 0 ? (
        <div className="pointer-events-auto w-full max-w-xs bg-bg-card border border-line rounded-xl p-3 text-xs text-ink">
          <p className="font-bold mb-1">Sebagian foto gagal diunggah:</p>
          <ul className="list-disc pl-4 flex flex-col gap-0.5">
            {errors.map((msg, i) => (
              <li key={i} className="break-words">{msg}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setErrors([])}
            className="mt-2 text-muted underline"
          >
            Tutup
          </button>
        </div>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
      <button
        type="button"
        onClick={openPicker}
        disabled={busy}
        title="Tambah foto"
        aria-label="Tambah foto"
        className="pointer-events-auto w-14 h-14 rounded-full border-[1.5px] border-ink bg-accent text-accent-contrast flex items-center justify-center shadow-lg disabled:opacity-60"
      >
        {busy ? (
          <span className="text-xs font-bold font-mono">
            {progress ? `${progress.done}/${progress.total}` : "..."}
          </span>
        ) : (
          <IconPlus />
        )}
      </button>
    </div>
  );
}
