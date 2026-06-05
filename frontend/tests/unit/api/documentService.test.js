import {
  saveDocumentOnExit,
  getUserDocuments,
  searchDocuments,
  createDocument,
  moveToTrash,
  permanentlyDeleteDocument,
  restoreFromTrash,
  getTrashedDocuments,
  emptyTrash,
  getDocument,
  updateDocumentContent,
  updateDocumentTitle,
  getDocumentById,
} from "@/api/documentService";
import axiosInstance, { fetchCsrfToken } from "@/api/axios";

jest.mock("@/api/axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  getApiBasePath: jest.fn().mockReturnValue("http://localhost/api"),
  fetchCsrfToken: jest.fn(),
}));

describe("DocumentService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
    Object.assign(navigator, {
      sendBeacon: jest.fn(),
    });
  });

  describe("saveDocumentOnExit", () => {
    it("uses sendBeacon if available", () => {
      navigator.sendBeacon.mockReturnValue(true);
      const result = saveDocumentOnExit("doc1", "content");
      expect(navigator.sendBeacon).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it("falls back to fetch if sendBeacon fails", async () => {
      navigator.sendBeacon.mockReturnValue(false);
      fetchCsrfToken.mockResolvedValue("token123");
      const result = saveDocumentOnExit("doc1", "content");
      
      expect(result).toBe(false);
      // Wait a tick for the async IIFE to complete
      await new Promise(process.nextTick);
      expect(global.fetch).toHaveBeenCalled();
      expect(global.fetch.mock.calls[0][1].headers).toHaveProperty("X-CSRF-Token", "token123");
    });
  });

  describe("getUserDocuments", () => {
    it("fetches documents with default limit", async () => {
      axiosInstance.get.mockResolvedValue({ data: [{ id: "1" }] });
      const result = await getUserDocuments();
      expect(axiosInstance.get).toHaveBeenCalledWith("/documents?limit=25");
      expect(result).toEqual([{ id: "1" }]);
    });

    it("returns empty array for index missing error", async () => {
      axiosInstance.get.mockRejectedValue({ response: { data: { error: "index missing" } } });
      const result = await getUserDocuments();
      expect(result).toEqual([]);
    });

    it("throws other errors", async () => {
      axiosInstance.get.mockRejectedValue(new Error("Network Error"));
      await expect(getUserDocuments()).rejects.toThrow("Network Error");
    });
    
    it("throws error if response is empty but error string lacks includes method", async () => {
      axiosInstance.get.mockRejectedValue({ response: { data: { error: 500 } } });
      await expect(getUserDocuments()).rejects.toEqual({ response: { data: { error: 500 } } });
    });
  });

  describe("saveDocumentOnExit catch blocks", () => {
    it("handles getApiBasePath throwing", () => {
      const { getApiBasePath } = require("@/api/axios");
      getApiBasePath.mockImplementationOnce(() => { throw new Error("bad path"); });
      const result = saveDocumentOnExit("doc1", "content");
      expect(result).toBe(false);
    });

    it("handles fetchCsrfToken throwing", async () => {
      navigator.sendBeacon.mockReturnValue(false);
      fetchCsrfToken.mockRejectedValue(new Error("csrf error"));
      
      const result = saveDocumentOnExit("doc1", "content");
      expect(result).toBe(false);
      
      await new Promise(process.nextTick);
      expect(global.fetch).toHaveBeenCalled();
    });

    it("handles fetch throwing", async () => {
      navigator.sendBeacon.mockReturnValue(false);
      fetchCsrfToken.mockResolvedValue("token123");
      global.fetch.mockRejectedValue(new Error("fetch failed"));
      
      const result = saveDocumentOnExit("doc1", "content");
      expect(result).toBe(false);
      
      await new Promise(process.nextTick);
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  describe("searchDocuments", () => {
    it("returns empty array currently", async () => {
      const result = await searchDocuments();
      expect(result).toEqual([]);
    });
  });

  describe("createDocument", () => {
    it("creates a document with default content", async () => {
      axiosInstance.post.mockResolvedValue({ data: { id: "1" } });
      const result = await createDocument();
      expect(axiosInstance.post).toHaveBeenCalledWith("/documents", expect.objectContaining({
        title: "Untitled Document"
      }));
      expect(result).toEqual({ id: "1" });
    });
  });

  describe("moveToTrash", () => {
    it("deletes a document to trash", async () => {
      axiosInstance.delete.mockResolvedValue({ data: { success: true } });
      const result = await moveToTrash("doc1");
      expect(axiosInstance.delete).toHaveBeenCalledWith("/documents/doc1");
      expect(result).toEqual({ success: true });
    });
  });

  describe("permanentlyDeleteDocument", () => {
    it("deletes a document permanently", async () => {
      axiosInstance.delete.mockResolvedValue({ data: { success: true } });
      const result = await permanentlyDeleteDocument("doc1");
      expect(axiosInstance.delete).toHaveBeenCalledWith("/documents/doc1");
      expect(result).toEqual({ success: true });
    });
  });

  describe("restoreFromTrash", () => {
    it("restores a document from trash", async () => {
      axiosInstance.put.mockResolvedValue({ data: { success: true } });
      const result = await restoreFromTrash("doc1");
      expect(axiosInstance.put).toHaveBeenCalledWith("/trash/doc1", { trashed: false });
      expect(result).toEqual({ success: true });
    });
  });

  describe("getTrashedDocuments", () => {
    it("fetches trashed documents", async () => {
      axiosInstance.get.mockResolvedValue({ data: [{ id: "1" }] });
      const result = await getTrashedDocuments();
      expect(axiosInstance.get).toHaveBeenCalledWith("/trash/");
      expect(result).toEqual([{ id: "1" }]);
    });
  });

  describe("emptyTrash", () => {
    it("empties the trash", async () => {
      axiosInstance.delete.mockResolvedValue({ data: { success: true } });
      const result = await emptyTrash();
      expect(axiosInstance.delete).toHaveBeenCalledWith("/trash/all");
      expect(result).toEqual({ success: true });
    });
  });

  describe("getDocument", () => {
    it("fetches a single document", async () => {
      axiosInstance.get.mockResolvedValue({ data: { id: "1", title: "Test" } });
      const result = await getDocument("1");
      expect(axiosInstance.get).toHaveBeenCalledWith("/documents/1");
      expect(result).toEqual({ id: "1", title: "Test" });
      expect(getDocumentById).toBe(getDocument); // Alias check
    });
  });

  describe("updateDocumentContent", () => {
    it("updates document content with string payload", async () => {
      axiosInstance.put.mockResolvedValue({ data: { success: true } });
      const result = await updateDocumentContent("doc1", "string content", 500);
      expect(axiosInstance.put).toHaveBeenCalledWith("/documents/doc1/content", {
        editorState: "string content",
        liveWordCap: 500,
      });
      expect(result).toEqual({ success: true });
    });

    it("updates document content with object payload", async () => {
      axiosInstance.put.mockResolvedValue({ data: { success: true } });
      const result = await updateDocumentContent("doc1", { root: {} }, 500);
      expect(axiosInstance.put).toHaveBeenCalledWith("/documents/doc1/content", {
        editorState: JSON.stringify({ root: {} }),
        liveWordCap: 500,
      });
      expect(result).toEqual({ success: true });
    });
  });

  describe("updateDocumentTitle", () => {
    it("updates document title", async () => {
      axiosInstance.put.mockResolvedValue({ data: { success: true } });
      const result = await updateDocumentTitle("doc1", "New Title");
      expect(axiosInstance.put).toHaveBeenCalledWith("/documents/doc1/title", { title: "New Title" });
      expect(result).toEqual({ success: true });
    });
  });
});
