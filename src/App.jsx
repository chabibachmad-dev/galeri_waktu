import { useEffect, useState, useCallback } from "react";
import AccessGate from "./components/AccessGate.jsx";
import Topbar from "./components/Topbar.jsx";
import Timeline from "./components/Timeline.jsx";
import UploadFab from "./components/UploadFab.jsx";
import { getStoredAccessCode, setStoredAccessCode, clearStoredAccessCode, verifyAccessCode } from "./lib/gallery.js";

const THEME_KEY = "gw_theme";

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || "light");
  const [status, setStatus] = useState("checking"); // checking | locked | unlocked
  const [accessCode, setAccessCode] = useState("");
  // Dinaikkan tiap kali ada foto baru tersimpan, dipakai Timeline sebagai
  // sinyal buat refetch -- lebih sederhana daripada mengangkat seluruh state
  // daftar foto ke sini.
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const stored = getStoredAccessCode();
    if (!stored) {
      setStatus("locked");
      return;
    }
    verifyAccessCode(stored).then((result) => {
      if (result.ok) {
        setAccessCode(stored);
        setStatus("unlocked");
      } else {
        clearStoredAccessCode();
        setStatus("locked");
      }
    });
  }, []);

  const handleUnlocked = useCallback((code) => {
    setAccessCode(code);
    setStoredAccessCode(code);
    setStatus("unlocked");
  }, []);

  const handleLogout = useCallback(() => {
    clearStoredAccessCode();
    setAccessCode("");
    setStatus("locked");
  }, []);

  const handlePhotoAdded = useCallback(() => {
    setRefreshTick((n) => n + 1);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  if (status === "checking") {
    return <div className="min-h-screen bg-bg" />;
  }

  if (status === "locked") {
    return <AccessGate theme={theme} onToggleTheme={toggleTheme} onUnlocked={handleUnlocked} />;
  }

  return (
    <div className="h-screen bg-bg text-ink flex flex-col overflow-hidden">
      <div className="mx-auto w-full max-w-3xl px-4 flex flex-col h-full overflow-hidden">
        <Topbar theme={theme} onToggleTheme={toggleTheme} onLogout={handleLogout} />
        {/* Ini satu-satunya area yang scroll -- Topbar & UploadFab di luar
            area ini sengaja tidak ikut ke-scroll (lihat catatan di index.css). */}
        <div className="app-scroll flex-1 overflow-y-auto flex flex-col" style={{ WebkitOverflowScrolling: "touch" }}>
          <Timeline accessCode={accessCode} refreshTick={refreshTick} />
        </div>
      </div>
      <UploadFab accessCode={accessCode} onUploaded={handlePhotoAdded} />
    </div>
  );
}
