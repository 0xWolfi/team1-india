import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Downgrade to warning — too many existing usages to fix at once.
      // Gradually replace `any` with proper types over time.
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow @ts-ignore/@ts-expect-error — needed for Prisma dynamic access
      // and third-party library type gaps.
      "@typescript-eslint/ban-ts-comment": "warn",
      // React 19 compiler rules — downgrade until codebase is refactored.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/static-components": "warn",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Utility scripts — not production code
    "scripts/**",
  ]),
]);

export default eslintConfig;
