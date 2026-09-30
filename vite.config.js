import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Base path disesuaikan otomatis untuk GitHub Pages lewat env GITHUB_PAGES_BASE
// (di-set oleh workflow .github/workflows/deploy.yml sebagai "/<nama-repo>/").
const base = process.env.GITHUB_PAGES_BASE || "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png"],
      manifest: {
        name: "Galeri Waktu",
        short_name: "Galeri Waktu",
        description: "Galeri foto berbasis timeline -- foto tersimpan di Google Drive, metadata di Supabase.",
        start_url: ".",
        scope: ".",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#000000",
        orientation: "portrait",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
        ]
      },
      workbox: {
        // App-shell caching sederhana -- data (foto/metadata) selalu diambil
        // fresh dari Supabase/Drive, cuma shell (JS/CSS/HTML) yang di-cache
        // supaya app tetap kebuka walau lagi tanpa sinyal.
        globPatterns: ["**/*.{js,css,html,png,svg,ico}"]
      }
    })
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
