import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores(["js/", "docs/", "node_modules/"]),
  js.configs.recommended,
  tseslint.configs.recommended,
);
