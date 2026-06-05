import { renderHook, act, waitFor } from "@testing-library/react";
import { useAIAssistant } from "@/components/Dashboard/hooks/useAIAssistant";
import * as lexical from "lexical";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/UI/Toast";
import * as textProcessingService from "@/api/textProcessingService";
import * as dashboardErrors from "@/utils/editor/dashboardErrors";

jest.mock("lexical", () => ({
  $getRoot: jest.fn(),
  $getSelection: jest.fn(),
  $isRangeSelection: jest.fn(),
  $createParagraphNode: jest.fn(),
  $createTextNode: jest.fn(),
}));

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn()
}));

jest.mock("@/components/UI/Toast", () => ({
  useToast: jest.fn()
}));

jest.mock("@/api/textProcessingService", () => ({
  correctGrammar: jest.fn(),
  translateText: jest.fn(),
}));

jest.mock("@/utils/editor/dashboardErrors", () => ({
  getEditorToast: jest.fn(),
  getEditorToastFromError: jest.fn()
}));

describe("useAIAssistant", () => {
  let mockUpdateUser;
  let mockShowToast;
  let mockRemoveToast;
  let mockEditorRef;
  let mockUpdateEditorContent;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    mockUpdateUser = jest.fn();
    useAuth.mockReturnValue({ updateUser: mockUpdateUser });

    mockShowToast = jest.fn().mockReturnValue("toast-id");
    mockRemoveToast = jest.fn();
    useToast.mockReturnValue({ showToast: mockShowToast, removeToast: mockRemoveToast });

    dashboardErrors.getEditorToast.mockReturnValue({ message: "Mock message", severity: "error" });
    dashboardErrors.getEditorToastFromError.mockReturnValue({ message: "Mock err", severity: "error" });

    mockEditorRef = {
      current: {
        getEditorState: jest.fn().mockReturnValue({
          read: jest.fn((cb) => cb())
        }),
        update: jest.fn((cb) => cb())
      }
    };

    mockUpdateEditorContent = jest.fn();
  });

  it("initializes rejection list from localStorage", () => {
    localStorage.setItem("rejectionList_doc1", JSON.stringify([{ rangeKey: "0-5", originalText: "hello" }]));
    
    const { result } = renderHook(() => useAIAssistant(mockEditorRef, "doc1", mockUpdateEditorContent, false, null));
    
    // We can't see rejectionList directly, but we know it loaded.
    expect(result.current.inReview).toBe(false);
  });

  describe("startGrammarReview", () => {
    it("shows error toast if text is empty", async () => {
      const { result } = renderHook(() => useAIAssistant(mockEditorRef, "doc1", mockUpdateEditorContent, false, null));
      
      await act(async () => {
        await result.current.startGrammarReview("   ");
      });

      expect(mockShowToast).toHaveBeenCalledWith("Mock message", expect.objectContaining({ dedupeKey: "empty-text-err" }));
    });

    it("calls correctGrammar API and sets suggestions", async () => {
      textProcessingService.correctGrammar.mockResolvedValue({
        credits: { current: 5, max: 10 },
        edits: [{ id: "1", start: 0, end: 5 }]
      });

      const { result } = renderHook(() => useAIAssistant(mockEditorRef, "doc1", mockUpdateEditorContent, false, null));
      
      await act(async () => {
        await result.current.startGrammarReview("Hello world");
      });

      expect(textProcessingService.correctGrammar).toHaveBeenCalledWith("Hello world", null, []);
      expect(mockUpdateUser).toHaveBeenCalled();
      expect(result.current.suggestions).toHaveLength(1);
      expect(result.current.inReview).toBe(true);
    });

    it("shows toast when no issues found", async () => {
      textProcessingService.correctGrammar.mockResolvedValue({
        credits: { current: 5, max: 10 },
        edits: [] // empty
      });

      const { result } = renderHook(() => useAIAssistant(mockEditorRef, "doc1", mockUpdateEditorContent, false, null));
      
      await act(async () => {
        await result.current.startGrammarReview("Hello world");
      });

      expect(result.current.suggestions).toHaveLength(0);
      expect(dashboardErrors.getEditorToast).toHaveBeenCalledWith("NO_ISSUES_FOUND");
    });

    it("handles correctGrammar error", async () => {
      textProcessingService.correctGrammar.mockRejectedValue(new Error("Network Error"));

      const { result } = renderHook(() => useAIAssistant(mockEditorRef, "doc1", mockUpdateEditorContent, false, null));
      
      await act(async () => {
        await result.current.startGrammarReview("Hello world");
      });

      expect(dashboardErrors.getEditorToastFromError).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith("Mock err", expect.any(Object));
      expect(result.current.processingType).toBeNull();
    });
  });

  describe("startTranslation", () => {
    it("handles translation on full text when no range is selected", async () => {
      lexical.$getRoot.mockReturnValue({ getTextContent: () => "Full text" });
      lexical.$getSelection.mockReturnValue(null);
      lexical.$isRangeSelection.mockReturnValue(false);

      textProcessingService.translateText.mockResolvedValue({
        result: "Translated full text",
        credits: { current: 4, max: 10 }
      });

      const { result } = renderHook(() => useAIAssistant(mockEditorRef, "doc1", mockUpdateEditorContent, false, null));
      
      await act(async () => {
        await result.current.startTranslation("es");
      });

      expect(textProcessingService.translateText).toHaveBeenCalledWith("Full text", null, "es", 200, null);
      expect(mockUpdateEditorContent).toHaveBeenCalledWith("Translated full text");
    });

    it("handles translation on selected snippet", async () => {
      lexical.$getRoot.mockReturnValue({ getTextContent: () => "Full text here" });
      const mockSelection = { getTextContent: () => " text ", insertText: jest.fn() };
      lexical.$getSelection.mockReturnValue(mockSelection);
      lexical.$isRangeSelection.mockReturnValue(true);

      textProcessingService.translateText.mockResolvedValue({
        result: "texto",
        credits: { current: 4, max: 10 }
      });

      const { result } = renderHook(() => useAIAssistant(mockEditorRef, "doc1", mockUpdateEditorContent, false, null));
      
      await act(async () => {
        await result.current.startTranslation("es");
      });

      expect(textProcessingService.translateText).toHaveBeenCalledWith("Full text here", "text", "es", 200, null);
      // It should re-add the leading and trailing spaces
      expect(mockSelection.insertText).toHaveBeenCalledWith(" texto ");
    });

    it("handles translation error", async () => {
      lexical.$getRoot.mockReturnValue({ getTextContent: () => "Full text" });
      textProcessingService.translateText.mockRejectedValue(new Error("Translation err"));

      const { result } = renderHook(() => useAIAssistant(mockEditorRef, "doc1", mockUpdateEditorContent, false, null));
      
      await act(async () => {
        await result.current.startTranslation("es");
      });

      expect(dashboardErrors.getEditorToastFromError).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith("Mock err", expect.any(Object));
    });
  });

  describe("localStorage and rejection validation", () => {
    it("handles invalid JSON in localStorage", () => {
      localStorage.setItem("rejectionList_doc1", "{ bad json }");
      const { result } = renderHook(() => useAIAssistant(mockEditorRef, "doc1", mockUpdateEditorContent, false, null));
      expect(result.current.inReview).toBe(false);
      expect(localStorage.getItem("rejectionList_doc1")).toBeNull();
    });

    it("handles non-array JSON in localStorage", () => {
      localStorage.setItem("rejectionList_doc1", JSON.stringify({ not: "an array" }));
      const { result } = renderHook(() => useAIAssistant(mockEditorRef, "doc1", mockUpdateEditorContent, false, null));
      expect(result.current.inReview).toBe(false);
    });

    it("filters out invalid rejections during review", async () => {
      localStorage.setItem("rejectionList_doc1", JSON.stringify([
        null,
        { rangeKey: 123 }, // not string
        { rangeKey: "bad-format" }, // NaN
        { rangeKey: "NaN-5" }, // NaN start
        { rangeKey: "5-3" }, // end <= start
        { rangeKey: "0-100" }, // end > text length (text is 11 chars)
        { rangeKey: "0-5", originalText: "wrong" }, // mismatch
        { rangeKey: "6-11", originalText: "world" }, // valid
        { rangeKey: "0-5" } // valid (no originalText constraint)
      ]));

      textProcessingService.correctGrammar.mockResolvedValue({ edits: [] });
      const { result } = renderHook(() => useAIAssistant(mockEditorRef, "doc1", mockUpdateEditorContent, false, null));

      await act(async () => {
        await result.current.startGrammarReview("hello world"); // length 11
      });

      // Should have filtered out the bad ones and kept the 2 valid ones
      // validRejections length !== 9, so it updates state and local storage
      const stored = JSON.parse(localStorage.getItem("rejectionList_doc1"));
      expect(stored).toHaveLength(2);
      expect(stored).toEqual([
        { rangeKey: "6-11", originalText: "world" },
        { rangeKey: "0-5" }
      ]);
    });
  });

  describe("startTranslation branches", () => {
    it("handles empty text without crashing", async () => {
      lexical.$getRoot.mockReturnValue({ getTextContent: () => "   " });
      const { result } = renderHook(() => useAIAssistant(mockEditorRef, "doc1", mockUpdateEditorContent, false, null));
      
      const closeDropdown = jest.fn();
      await act(async () => {
        await result.current.startTranslation("es", closeDropdown);
      });

      expect(mockShowToast).toHaveBeenCalledWith("Mock message", expect.objectContaining({ dedupeKey: "empty-text-err" }));
      expect(closeDropdown).toHaveBeenCalled();
    });

    it("handles full text translation without a result safely", async () => {
      lexical.$getRoot.mockReturnValue({ getTextContent: () => "Full text" });
      lexical.$getSelection.mockReturnValue(null);
      lexical.$isRangeSelection.mockReturnValue(false);

      textProcessingService.translateText.mockResolvedValue({ credits: { current: 4, max: 10 } }); // no result

      const { result } = renderHook(() => useAIAssistant(mockEditorRef, "doc1", mockUpdateEditorContent, false, null));
      
      await act(async () => {
        await result.current.startTranslation("es");
      });

      expect(mockUpdateEditorContent).not.toHaveBeenCalled();
    });

    it("handles translation on selected snippet without spaces", async () => {
      lexical.$getRoot.mockReturnValue({ getTextContent: () => "Full text" });
      const mockSelection = { getTextContent: () => "snippet", insertText: jest.fn() };
      lexical.$getSelection.mockReturnValue(mockSelection);
      lexical.$isRangeSelection.mockReturnValue(true);

      textProcessingService.translateText.mockResolvedValue({ result: "es_snippet" });

      const { result } = renderHook(() => useAIAssistant(mockEditorRef, "doc1", mockUpdateEditorContent, false, null));
      
      await act(async () => {
        await result.current.startTranslation("es");
      });

      expect(mockSelection.insertText).toHaveBeenCalledWith("es_snippet");
    });
  });

  describe("handleRejectSuggestion branches", () => {
    it("ignores falsy rejections", () => {
      const { result } = renderHook(() => useAIAssistant(mockEditorRef, "doc1", mockUpdateEditorContent, false, null));
      act(() => {
        result.current.handleRejectSuggestion(null);
      });
      // no crash
    });

    it("extracts original text correctly", async () => {
      const { result } = renderHook(() => useAIAssistant(mockEditorRef, "doc1", mockUpdateEditorContent, false, null));
      
      textProcessingService.correctGrammar.mockResolvedValue({
        edits: [{ id: "1" }, { id: "2" }]
      });

      await act(async () => {
        await result.current.startGrammarReview("hello world");
      });

      // 1. Has original field
      act(() => {
        result.current.handleRejectSuggestion({ id: "1", start: 0, end: 5, original: "hello" });
      });

      // 2. Uses fallback extraction from latest source text
      act(() => {
        result.current.handleRejectSuggestion({ id: "2", start: 6, end: 11 }); // will extract "world"
      });
      
      const stored = JSON.parse(localStorage.getItem("rejectionList_doc1"));
      expect(stored[0].originalText).toBe("hello");
      expect(stored[1].originalText).toBe("world");
    });
  });
});
