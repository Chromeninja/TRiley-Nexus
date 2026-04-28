import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import astroParser from "astro-eslint-parser";
import astroPlugin from "eslint-plugin-astro";
import eslintConfigPrettier from "eslint-config-prettier";

const tsRules = tsPlugin.configs.recommended.rules;

export default [
  {
    ignores: ["dist/**", "node_modules/**", ".astro/**"],
  },
  {
    files: ["**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        process: "readonly",
      },
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },
  js.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        sourceType: "module",
        ecmaVersion: "latest",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsRules,
      "no-undef": "off",
    },
  },
  {
    files: ["**/*.d.ts"],
    rules: {
      "@typescript-eslint/triple-slash-reference": "off",
    },
  },
  {
    files: ["**/*.astro"],
    languageOptions: {
      parser: astroParser,
      parserOptions: {
        parser: tsParser,
        sourceType: "module",
        ecmaVersion: "latest",
        extraFileExtensions: [".astro"],
      },
    },
    plugins: {
      astro: astroPlugin,
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...astroPlugin.configs.recommended.rules,
      ...tsRules,
      "no-undef": "off",
    },
  },
  eslintConfigPrettier,
];
