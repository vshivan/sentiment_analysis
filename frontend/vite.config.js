import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    server: {
      port: 3000,
      // Proxy /api calls to Flask backend during development only.
      // In production the built static files are served separately and
      // VITE_API_URL must point to the deployed backend.
      proxy: {
        "/api": {
          target: env.VITE_BACKEND_PROXY || "http://localhost:5000",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ""),
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: false,
    },
  };
});
