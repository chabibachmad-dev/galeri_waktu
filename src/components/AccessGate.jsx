import { useState } from "react";
import { IconLock, IconMoon, IconSun } from "../icons.jsx";
import { verifyAccessCode } from "../lib/gallery.js";

export default function AccessGate({ theme, onToggleTheme, onUnlocked }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!code.trim()) return;
    setSubmitting(true);
    setError("");

    const result = await verifyAccessCode(code.trim());
    setSubmitting(false);

    if (!result.ok) {
      setError(result.unauthorized ? "Kode akses salah, coba lagi." : result.message || "Gagal memverifikasi kode.");
      return;
    }
    onUnlocked(code.trim());
  }

  return (
    <div
      className="min-h-screen bg-bg text-ink flex flex-col"
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <button
        type="button"
        onClick={onToggleTheme}
        title="Ganti tema"
        aria-label="Ganti tema"
        className="self-end m-4 w-10 h-10 rounded-full border border-line flex items-center justify-center flex-shrink-0"
      >
        {theme === "dark" ? <IconSun /> : <IconMoon />}
      </button>

      <div className="flex-1 flex flex-col items-center px-4" style={{ paddingTop: "8vh" }}>
        <h1 className="text-xl font-bold">Galeri Waktu</h1>
        <p className="text-muted text-sm text-center mt-1 mb-7 max-w-xs">
          Kumpulan foto kenangan, tersusun rapi berdasarkan waktu.
        </p>

        <div className="w-full max-w-sm border border-line rounded-2xl p-5 bg-bg-card flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-bold">
            <IconLock className="flex-shrink-0" />
            <span>Kode Akses</span>
          </div>
          <p className="text-muted text-sm -mt-2">Galeri ini privat. Masukkan kode akses untuk membukanya.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              placeholder="Kode akses"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-3.5 py-3 rounded-lg border border-line bg-bg text-ink font-mono"
            />
            {error ? <p className="text-ink font-bold text-sm">{error}</p> : null}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-lg border-[1.5px] border-ink bg-accent text-accent-contrast font-bold disabled:opacity-50"
            >
              {submitting ? "Memeriksa..." : "Buka"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
