// frontend/babel.config.cjs
module.exports = {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    ["@babel/preset-react", { runtime: "automatic" }],
  ],
  plugins: [
    [
      "transform-define",
      {
        "import.meta.env.VITE_API_BASE_URL": process.env.JEST_VITE_API_BASE_URL || "http://localhost:3001/api/default-mock-for-babel",
        "import.meta.env.VITE_DISABLE_BEACON": "false",
        "import.meta.env.VITE_USE_BEARER": "false",
        "import.meta.env.VITE_API_URL": "/api",
      },
    ],
  ],
};
