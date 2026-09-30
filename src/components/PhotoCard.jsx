import { useState } from "react";
import { IconEdit, IconCheck, IconX, IconTrash } from "../icons.jsx";
import { formatDateShort } from "../lib/format.js";

export default function PhotoCard({ photo, accessCode, onUpdateTitle, onDelete, onOpenLightbox }) {
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(photo.title);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function startEdit() {
    setDraftTitle(photo.title);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setDraftTitle(photo.title);
  }

  async function saveEdit() {
    const trimmed = draftTitle.trim();
    if (!trimmed || trimmed === photo.title) {
      setEditing(false);
      return;
    }
    setSaving(true);
    const ok = await onUpdateTitle(photo.id, trimmed);
    setSaving(false);
    if (ok) setEditing(false);
  }

  async function handleDelete() {
    if (deleting) return;
    if (!window.confirm(`Hapus foto "${photo.title}"? Ini tidak bisa dibatalkan.`)) return;
    setDeleting(true);
    await onDelete(photo.id);
    // Tidak perlu setDeleting(false) di jalur sukses -- kartu ini akan
    // hilang dari daftar begitu parent refetch.
  }

  return (
    <figure className="border border-line rounded-2xl overflow-hidden bg-bg-card flex flex-col">
      <button
        type="button"
        onClick={() => onOpenLightbox?.(photo)}
        className="aspect-square bg-bg overflow-hidden block w-full p-0 border-0 cursor-pointer"
        title="Lihat foto penuh"
        aria-label="Lihat foto penuh"
      >
        <img
          src={photo.drive_url}
          alt={photo.title}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </button>
      <figcaption className="p-3 flex flex-col gap-1.5">
        {editing ? (
          <div className="flex items-center gap-1.5">
            <input
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              autoFocus
              maxLength={200}
              className="flex-1 min-w-0 px-2 py-1.5 rounded-md border border-line bg-bg text-ink text-base font-mono"
            />
            <button
              type="button"
              onClick={saveEdit}
              disabled={saving}
              title="Simpan"
              aria-label="Simpan judul"
              className="w-7 h-7 rounded-full border border-line flex items-center justify-center flex-shrink-0 disabled:opacity-50"
            >
              <IconCheck />
            </button>
            <button
              type="button"
              onClick={cancelEdit}
              disabled={saving}
              title="Batal"
              aria-label="Batal edit judul"
              className="w-7 h-7 rounded-full border border-line flex items-center justify-center flex-shrink-0 disabled:opacity-50"
            >
              <IconX />
            </button>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-bold leading-snug break-words">{photo.title}</p>
            <button
              type="button"
              onClick={startEdit}
              title="Edit judul"
              aria-label="Edit judul"
              className="w-6 h-6 rounded-full border border-line flex items-center justify-center flex-shrink-0 mt-0.5"
            >
              <IconEdit />
            </button>
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted">{formatDateShort(photo.taken_at)}</span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            title="Hapus foto"
            aria-label="Hapus foto"
            className="w-6 h-6 rounded-full border border-line flex items-center justify-center flex-shrink-0 disabled:opacity-50"
          >
            <IconTrash />
          </button>
        </div>
      </figcaption>
    </figure>
  );
}
