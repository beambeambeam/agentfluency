import { bindings, defineConfig } from "cf/config";

const domain = "agentfluency.thisisbeam.fyi";

export default defineConfig({
  worker: {
    name: "agentfluency",
    entrypoint: "@tanstack/react-start/server-entry",
    compatibilityDate: "2026-11-21",
    compatibilityFlags: ["nodejs_compat"],
    domains: [domain],
    workersDev: false,
    previewUrls: false,
    env: {
      BETTER_AUTH_URL: bindings.text(`https://${domain}`),
      BETTER_AUTH_SECRET: bindings.secret(),
      DATABASE_URL: bindings.secret(),
    },
  },
});
