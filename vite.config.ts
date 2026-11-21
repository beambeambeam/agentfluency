import ultraciteFormat from "ultracite/oxfmt";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";
import tanstack from "ultracite/oxlint/tanstack";
import { defineConfig } from "vite-plus";
import { configDefaults } from "vite-plus/test/config";

const toolOutput = ["apps/web/.tanstack/**", "apps/web/.vinxi/**"];
const vendorSource = ["apps/web/src/lib/dither/**"];

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    include: [
      ...configDefaults.include,
      "apps/web/src/features/**/__tests__/index.{ts,tsx}",
    ],
  },
  lint: {
    env: core.env,
    extends: [core, react, tanstack],
    plugins: [...core.plugins, "vitest"],
    rules: {
      "vitest/consistent-test-it": [
        "error",
        { fn: "test", withinDescribe: "test" },
      ],
    },
    ignorePatterns: [...core.ignorePatterns, ...toolOutput, ...vendorSource],
    overrides: [
      {
        // The WAI-ARIA window splitter is a focusable separator.
        files: ["apps/web/src/features/interview/workbench-split.tsx"],
        rules: { "jsx-a11y/prefer-tag-over-role": "off" },
      },
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
      ...vendorSource,
      ".agents/skills/**",
    ],
  },
  staged: {
    "*.{js,ts,jsx,tsx,vue,svelte,json,jsonc,css,md}": "vp check --fix",
  },
});
