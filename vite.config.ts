import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const useMock = env.VITE_USE_MOCK === "1";
  const apiTarget = env.VITE_API_TARGET || "http://localhost:3001";

  return {
    plugins: [react()],
    resolve: {
      alias: { "@": path.resolve(__dirname, "./src") },
    },
    server: {
      port: 5173,
      proxy: useMock
        ? undefined
        : {
            "/api": { target: apiTarget, changeOrigin: true },
            "/ws": { target: apiTarget, changeOrigin: true, ws: true },
          },
    },
  };
});
