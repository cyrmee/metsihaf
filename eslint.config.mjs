import js from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: [".next", "next-env.d.ts", "scripts", "mobile"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  ...nextCoreWebVitals,
  {
    rules: {
      // React Compiler-readiness rules; this app has no React Compiler adoption
      // plan and these flag long-standing, correct SSR-safe mount-effect
      // patterns (e.g. syncing from localStorage) used throughout the codebase.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
    },
  },
  eslintPluginPrettier,
);
