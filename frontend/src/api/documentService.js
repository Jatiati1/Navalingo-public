// src/api/documentService.js  (unchanged)
import axiosInstance, { getApiBasePath, fetchCsrfToken } from "./axios";

const USE_BEACON = (import.meta.env.VITE_DISABLE_BEACON ?? "false") !== "true";

export const saveDocumentOnExit = (docId, content) => {
  try {
    const apiBase = getApiBasePath();
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

export const searchDocuments = async () => {
  return [];
};

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

export const moveToTrash = async (docId) => {
  const { data } = await axiosInstance.delete(`/documents/${docId}`);
  return data;
};

export const permanentlyDeleteDocument = async (docId) => {
  const { data } = await axiosInstance.delete(`/documents/${docId}`);
  return data;
};

export const restoreFromTrash = async (docId) => {
  const { data } = await axiosInstance.put(`/trash/${docId}`, {
    trashed: false,
  });
  return data;
};

export const getTrashedDocuments = async () => {
  const { data } = await axiosInstance.get("/trash/");
  return data;
};

export const emptyTrash = async () => {
  const { data } = await axiosInstance.delete("/trash/all");
  return data;
};

export const getDocument = async (docId) => {
  const { data } = await axiosInstance.get(`/documents/${docId}`);
  return data;
};

export const updateDocumentContent = async (docId, editorState, liveCap) => {
  const payload =
    typeof editorState === "string" ? editorState : JSON.stringify(editorState);

  const { data } = await axiosInstance.put(`/documents/${docId}/content`, {
    editorState: payload,
    liveWordCap: liveCap,
  });
  return data;
};

export const updateDocumentTitle = async (docId, title) => {
  const { data } = await axiosInstance.put(`/documents/${docId}/title`, {
    title,
  });
  return data;
};

export const getDocumentById = getDocument;
