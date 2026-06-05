//frontend /.eslintrc.cjs

/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,

  // base presets
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],

  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  settings: { react: { version: "detect" } },

  /* ─── Global rules ─────────────────────────────────────────────── */
  rules: {
    // we do NOT use runtime PropTypes
    "react/prop-types": "off",

    // ignore unused vars named React (new JSX transform)
    "no-unused-vars": ["error", { varsIgnorePattern: "^React$" }],
  },

  /* ─── File-specific overrides ──────────────────────────────────── */
  overrides: [
    /* Jest test files */
    {
      files: ["tests/**/*.{test,spec}.{js,jsx,ts,tsx}"],
      env: { jest: true, node: true },
      plugins: ["jest"],
      extends: ["plugin:jest/recommended"],
    },

    /* Mock & config files (CommonJS / Node) */
    {
      files: [
        "vite.config.*",
        "*.config.js",
        "*.config.cjs",
        "*.config.mjs",
        "tests/_mocks_/**",
      ],
      env: { node: true },
      rules: {
        // allow CommonJS globals like module.exports in mocks
        "no-undef": "off",
      },
    },
  ],
};
