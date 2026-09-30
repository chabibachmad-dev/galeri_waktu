/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  // Dark mode di-toggle manual lewat atribut data-theme="dark" di <html>
  // (sama seperti ringkasan_harian/dompet_harian, bukan prefers-color-scheme),
  // jadi dipetakan ke selector kustom, bukan strategi "class" bawaan Tailwind.
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      // Warna-warna ini menunjuk ke CSS custom properties di src/index.css
      // supaya bisa berubah live saat tema di-toggle, tanpa perlu dua set
      // class Tailwind terpisah untuk light/dark.
      colors: {
        bg: "var(--bg)",
        "bg-card": "var(--bg-card)",
        ink: "var(--text)",
        muted: "var(--text-muted)",
        line: "var(--border)",
        accent: "var(--accent)",
        "accent-contrast": "var(--accent-contrast)",
        soft: "var(--notify-bg)"
      },
      fontFamily: {
        mono: ["Ubuntu Mono", "ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"]
      }
    }
  },
  plugins: []
};
