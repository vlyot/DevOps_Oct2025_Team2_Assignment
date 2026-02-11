import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
  test: {
    globals: true, // <--- This fixes "describe is not defined"
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts", // <--- This runs your setup file
    css: true,
  },
});
