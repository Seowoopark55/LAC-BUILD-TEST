import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/build/",
  server: {
    host: true,
    port: 5173
  }
});
