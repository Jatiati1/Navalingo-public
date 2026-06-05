/* ────────────────────────────────────────────────────────────────────────────
 *
 * eslint.config.js
 *
 * ESLint "flat" configuration file.
 * See: https://eslint.org/docs/latest/use/configure/configuration-files-new
 *
 * ───────────────────────────────────────────────────────────────────────── */

// @ts-check

/* ---------------------------------- IMPORTS --------------------------------- */
import js from "@eslint/js";
import globals from "globals";

/* ESLint Plugins */
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import jestPlugin from "eslint-plugin-jest";
import importPlugin from "eslint-plugin-import";
import reactRefresh from "eslint-plugin-react-refresh";

/* --------------------------------- CONFIG --------------------------------- */
export default [
  /* ---------------------- Global Ignores & Settings ----------------------- */
  {
    ignores: ["dist/**"],
  },

  /* ------------------- 1) JavaScript & React Source Files ------------------- */
  {
    files: ["src/**/*.{js,jsx}"],
    plugins: {
      import: importPlugin,
      react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
      "react-refresh": reactRefresh,
    },
    languageOptions: {
      sourceType: "module",
      ecmaVersion: "latest",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        Intl: "readonly", // Explicitly define the Intl global
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "no-unused-vars": [
        "error",
        {
          varsIgnorePattern: "^(React|styles)$",
        },
      ],
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
    },
  },

  /* ------------------------- 2) Jest Test Files ------------------------- */
  {
    files: ["**/*.{test,spec}.{js,jsx}"],
    plugins: {
      // ❗ FIX: Added React and Import plugins for tests
      react,
      import: importPlugin,
      jest: jestPlugin,
    },
    languageOptions: {
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.node,
        ...jestPlugin.environments.globals.globals,
      },
    },
    settings: {
      // ❗ FIX: Added React version setting for tests
      react: {
        version: "detect",
      },
    },
    rules: {
      ...jestPlugin.configs["flat/recommended"].rules,
      // You can keep React-specific rules off in tests if you want
      "react/prop-types": "off",
      "jest/no-disabled-tests": "warn",
      "jest/no-focused-tests": "error",
    },
  },

  /* ---------------------- 3) Node.js / Config Files ----------------------- */
  {
    files: ["*.config.js", "jest.setup.js"],
    languageOptions: {
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
  },
];
