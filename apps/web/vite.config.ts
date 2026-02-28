import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on("error", (err, _req, _res) => {
            if ((err as NodeJS.ErrnoException).code === "ECONNREFUSED") {
              console.warn("[Vite] El backend no está disponible. Inicia el API con: cd apps/api && npm run dev");
            }
          });
        },
      },
    },
  },
});
