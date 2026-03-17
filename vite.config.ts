import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  // Widget olarak build edildiğinde base path'i ayarla
  base: mode === "widget" ? "./" : "/",
  build: {
    // Tek JS dosyası çıkması için
    rollupOptions: {
      output: {
        // Hash'siz dosya adları (Razor Pages'da referans vermesi kolay olsun)
        entryFileNames: "survengine.js",
        chunkFileNames: "survengine-[name].js",
        assetFileNames: "survengine.[ext]",
        // Tüm JS'i tek dosyaya topla
        manualChunks: undefined,
      },
    },
    // CSS'i JS içine inline et (tek dosya olsun)
    cssCodeSplit: false,
    // Çıktı dizini
    outDir: mode === "widget" ? "dist-widget" : "dist",
  },
}));
