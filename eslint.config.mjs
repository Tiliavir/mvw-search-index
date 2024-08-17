import tsEsLint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

export default [
  {
    files: ["**/*.ts"],
    plugins: {
      "@typescript-eslint": tsEsLint,
    },

    languageOptions: {
      parser: tsParser,
    }
  },
];
