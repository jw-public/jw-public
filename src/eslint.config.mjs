// ESLint flat config — pragmatic baseline for the modernized codebase.
// Goal: catch real bug classes (unused symbols, broken hooks, foot-guns)
// without fighting two decades of legacy style. Tighten incrementally.
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-config-prettier";
import unusedImports from "eslint-plugin-unused-imports";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      ".meteor/**",
      "typings/**",
      "public/**",
      "build-utils/**",
      "**/*.d.ts",
      "tests/3rdParty/minimongo-standalone/minimongo-standalone-js.js",
      "eslint.config.mjs",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      react,
      "react-hooks": reactHooks,
      "unused-imports": unusedImports,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // One-shot subscription→state mirrors are a legitimate Meteor pattern;
      // revisit with the React compiler.
      "react-hooks/set-state-in-effect": "warn",
      // Legacy reality — revisit as the code tightens:
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" },
      ],
      "@typescript-eslint/no-namespace": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "prefer-const": "off",
      "no-var": "off",
      // Meteor globals used in a handful of places
      "no-undef": "off",
    },
  },
);
