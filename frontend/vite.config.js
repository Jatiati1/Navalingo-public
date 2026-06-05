// frontend/vite.config.js

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  /* ───── shared config ───── */
  const config = {
    plugins: [react()],
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
    // Force the correct API URL depending on the mode.
    define: {
      "import.meta.env.VITE_API_URL": JSON.stringify("/api"),
    },
  };

  /* ───── local-dev server ───── */
  if (mode === "development") {
    config.server = {
      proxy: {
        "/api": {
          target: "http://127.0.0.1:5001/navalingo-live/us-central1/api",
          changeOrigin: true,
        },
      },
    };
  }

  return config;
});
