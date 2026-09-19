import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { host: true },
  // Render Web Service: esikatselupalvelin kuuntelee kaikkia osoitteita ja hyväksyy Renderin verkkotunnuksen.
  preview: { host: true, allowedHosts: true },
  build: { chunkSizeWarningLimit: 1000 },
});
