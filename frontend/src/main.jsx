// frontend/src/main.jsx
// App entry: mounts providers (React Query, Router, Toast, Auth) and global styles.

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AuthProvider } from "./context/AuthContext.jsx";
import { ToastProvider } from "./components/UI/Toast/ToastProvider.jsx";
import App from "./App";

// Global styles (import once at root)
import "./styles/variables.css";
import "./styles/global.css";
import "./styles/base.css";

// React Query client
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000, // 30s
    },
    mutations: {
      retry: 0,
    },
  },
});

// React Router future flags
const routerFutureFlags = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={routerFutureFlags}>
        <ToastProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
