// frontend/src/api/documentService.js
// Document API helpers and save-on-exit (sendBeacon with CSRF-aware fetch fallback).

import axiosInstance, { getApiBasePath, fetchCsrfToken } from "./axios";

// Feature switch: set VITE_DISABLE_BEACON=true to always use the fetch fallback.
const USE_BEACON = (import.meta.env.VITE_DISABLE_BEACON ?? "false") !== "true";

// Best-effort save right before page unload.
// 1) Try navigator.sendBeacon() to an absolute API URL.
// 2) If unavailable or disabled, fall back to fetch with keepalive,
//    credentials, and CSRF header when available.
// Returns true if sendBeacon was queued; false if fallback was used.
export const saveDocumentOnExit = (docId, content) => {
  try {
    const apiBase = getApiBasePath(); // e.g., https://app.example.com/api
    const url = `${apiBase}/documents/${docId}/save`;
    const body =
      content instanceof Blob
        ? content
        : new Blob([String(content)], { type: "text/plain; charset=UTF-8" });

    if (USE_BEACON && typeof navigator.sendBeacon === "function") {
      const queued = navigator.sendBeacon(url, body);
      if (queued) return true;
    }

    (async () => {
      const headers = { "Content-Type": "text/plain; charset=UTF-8" };
      try {
        const token = await fetchCsrfToken();
        if (token) headers["X-CSRF-Token"] = token;
      } catch {
        // If CSRF fetch fails, still attempt the save
      }
      try {
        await fetch(url, {
          method: "POST",
          body,
          credentials: "include",
          keepalive: true,
          headers,
        });
      } catch {
        // Ignore errors during unload path
      }
    })();

    return false;
  } catch {
    return false;
  }
};

// List documents for the current user.
// Returns [] on known Firestore index errors to keep the UI stable.
export const getUserDocuments = async (limit = 25) => {
  try {
    const { data } = await axiosInstance.get(`/documents?limit=${limit}`);
    return data;
  } catch (err) {
    if (err?.response?.data?.error?.includes?.("index")) {
      return [];
    }
    throw err;
  }
};

// Deprecated: remote search removed; use client-side filtering instead.
export const searchDocuments = async () => {
  return [];
};

// Create a new document with an initial title and editor state.
export const createDocument = async (
  title = "Untitled Document",
  content = '{"root":{"children":[{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}'
) => {
  const { data } = await axiosInstance.post("/documents", {
    title,
    editorState: content,
  });
  return data;
};

// Move a document to trash (soft delete).
export const moveToTrash = async (docId) => {
  const { data } = await axiosInstance.delete(`/documents/${docId}`);
  return data;
};

// Permanently delete a document.
// Note: uses the same endpoint as moveToTrash in this API surface.
export const permanentlyDeleteDocument = async (docId) => {
  const { data } = await axiosInstance.delete(`/documents/${docId}`);
  return data;
};

// Restore a document from trash.
export const restoreFromTrash = async (docId) => {
  const { data } = await axiosInstance.put(`/trash/${docId}`, {
    trashed: false,
  });
  return data;
};

// List trashed documents.
export const getTrashedDocuments = async () => {
  const { data } = await axiosInstance.get("/trash/");
  return data;
};

// Empty the trash for the current user.
export const emptyTrash = async () => {
  const { data } = await axiosInstance.delete("/trash/all");
  return data;
};

// Fetch a single document.
export const getDocument = async (docId) => {
  const { data } = await axiosInstance.get(`/documents/${docId}`);
  return data;
};

// Update a document's editor state (optionally with a live word cap).
export const updateDocumentContent = async (docId, editorState, liveCap) => {
  const payload =
    typeof editorState === "string" ? editorState : JSON.stringify(editorState);

  const { data } = await axiosInstance.put(`/documents/${docId}/content`, {
    editorState: payload,
    liveWordCap: liveCap,
  });
  return data;
};

// Update a document's title.
export const updateDocumentTitle = async (docId, title) => {
  const { data } = await axiosInstance.put(`/documents/${docId}/title`, {
    title,
  });
  return data;
};

// Back-compat alias.
export const getDocumentById = getDocument;
