import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The frontend calls "/api/..." and "/uploads/..." on its own origin and Vite
// forwards them to the Express server. So no CORS / cookie problems on localhost.
const API = "http://localhost:8800";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      "/api": { target: API, changeOrigin: true },
      "/uploads": { target: API, changeOrigin: true },
    },
  },
});
