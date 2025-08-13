import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Load environment variables based on the current mode
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    optimizeDeps: {
      exclude: ["lucide-react"],
    },
    server: {
      host: env.VITE_HOST || "0.0.0.0", // Use VITE_HOST from .env or default to '0.0.0.0'
      port: parseInt(env.VITE_PORT || "3000", 10), // Use VITE_PORT from .env or default to 3000
    },
  };
});
