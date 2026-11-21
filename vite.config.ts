import ultraciteFormat from "ultracite/oxfmt";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";
import tanstack from "ultracite/oxlint/tanstack";
import { defineConfig } from "vite-plus";

const toolOutput = ["apps/web/.tanstack/**", "apps/web/.vinxi/**"];

export default defineConfig({
  lint: {
    env: core.env,
    extends: [core, react, tanstack],
    ignorePatterns: [...core.ignorePatterns, ...toolOutput],
    overrides: [
      {
        // Better Auth emits inline purity annotations in the generated schema.
        files: ["packages/db/src/schema/auth.ts"],
        rules: { "no-inline-comments": "off" },
      },
    ],
    options: {
      typeAware: false,
      typeCheck: false,
    },
  },
  fmt: {
    ...ultraciteFormat,
    ignorePatterns: [
      ...ultraciteFormat.ignorePatterns,
      ...toolOutput,
      ".agents/skills/**",
    ],
  },
  staged: {
    "*.{js,ts,jsx,tsx,vue,svelte,json,jsonc,css,md}": "vp check --fix",
  },
});
