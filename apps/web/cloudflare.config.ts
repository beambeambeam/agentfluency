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
      AWS_ENDPOINT_URL_S3: bindings.secret(),
      AWS_ACCESS_KEY_ID: bindings.secret(),
      AWS_SECRET_ACCESS_KEY: bindings.secret(),
      AWS_REGION: bindings.secret(),
      BETTER_AUTH_URL: bindings.text(`https://${domain}`),
      BETTER_AUTH_SECRET: bindings.secret(),
      DATABASE_URL: bindings.secret(),
    },
  },
});
