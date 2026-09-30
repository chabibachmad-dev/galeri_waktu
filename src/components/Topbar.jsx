import { IconMoon, IconSun, IconLock } from "../icons.jsx";

export default function Topbar({ theme, onToggleTheme, onLogout }) {
  return (
    <header className="sticky top-0 z-10 -mx-4 px-4 py-3 bg-bg border-b border-line flex items-center justify-between">
      <h1 className="text-base font-bold tracking-tight">Galeri Waktu</h1>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleTheme}
          title="Ganti tema"
          aria-label="Ganti tema"
          className="w-9 h-9 rounded-full border border-line flex items-center justify-center flex-shrink-0"
        >
          {theme === "dark" ? <IconSun /> : <IconMoon />}
        </button>
        <button
          type="button"
          onClick={onLogout}
          title="Kunci galeri"
          aria-label="Kunci galeri"
          className="w-9 h-9 rounded-full border border-line flex items-center justify-center flex-shrink-0"
        >
          <IconLock className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
