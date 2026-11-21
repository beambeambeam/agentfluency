import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { varlockVitePlugin } from "@varlock/vite-integration";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

export default defineConfig(({ mode }) => ({
  server: {
    port: 3001,
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    mode === "production"
      ? cloudflare()
      : varlockVitePlugin({ ssrInjectMode: "auto-load" }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
}));
