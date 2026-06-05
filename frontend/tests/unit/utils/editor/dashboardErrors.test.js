import {
  getEditorToast,
  inferEditorErrorCode,
  getEditorToastFromError,
} from "@/utils/editor/dashboardErrors";

describe("dashboardErrors", () => {
  describe("getEditorToast", () => {
    it("returns toast config for string message", () => {
      const toast = getEditorToast("EMPTY_TEXT_ERROR");
      expect(toast.code).toBe("EMPTY_TEXT_ERROR");
      expect(toast.message).toBe("Cannot process empty text.");
      expect(toast.severity).toBe("warning");
    });

    it("returns toast config for function message (with context)", () => {
      const toast = getEditorToast("WORD_LIMIT_EXCEEDED", { limit: 500 });
      expect(toast.code).toBe("WORD_LIMIT_EXCEEDED");
      expect(toast.message).toBe("Text exceeds word limit of 500. Please shorten it.");
      expect(toast.severity).toBe("error");
    });

    it("falls back to UNKNOWN_ERROR if code is unrecognized", () => {
      const toast = getEditorToast("NOT_A_REAL_CODE");
      expect(toast.code).toBe("UNKNOWN_ERROR");
      expect(toast.message).toBe("An unknown error occurred. Please try again.");
      expect(toast.severity).toBe("error");
    });

    it("includes persist and actionLabel if defined", () => {
      const toast = getEditorToast("FREE_USER_INSUFFICIENT_CREDITS");
      expect(toast.persist).toBe(true);
      expect(toast.actionLabel).toBe("Upgrade to Pro");
    });
  });

  describe("inferEditorErrorCode", () => {
    it("infers TIMEOUT from ECONNABORTED", () => {
      const code = inferEditorErrorCode({ code: "ECONNABORTED" });
      expect(code).toBe("TIMEOUT");
    });

    it("infers WORD_LIMIT_EXCEEDED from backend error text", () => {
      const code = inferEditorErrorCode({
        response: { data: { error: "text exceeds word limit of 500" } }
      });
      expect(code).toBe("WORD_LIMIT_EXCEEDED");
    });

    it("infers RATE_LIMITED from 429 status", () => {
      const code = inferEditorErrorCode({
        response: { status: 429 }
      });
      expect(code).toBe("RATE_LIMITED");
    });

    it("infers NETWORK_ERROR if request exists but no response", () => {
      const code = inferEditorErrorCode({
        request: {},
        response: undefined
      });
      expect(code).toBe("NETWORK_ERROR");
    });

    it("infers UNKNOWN_ERROR as fallback", () => {
      const code = inferEditorErrorCode({});
      expect(code).toBe("UNKNOWN_ERROR");
    });

    it("infers AI_UNSUPPORTED_LANGUAGE from backend error", () => {
      const code = inferEditorErrorCode({
        response: { data: { error: "Language is ambiguous or not in English/Spanish" } }
      });
      expect(code).toBe("AI_UNSUPPORTED_LANGUAGE");
    });

    it("infers AI_GIBBERISH_DETECTED from backend error", () => {
      const code = inferEditorErrorCode({
        response: { data: { error: "Gibberish text detected." } }
      });
      expect(code).toBe("AI_GIBBERISH_DETECTED");
    });

    it("infers AI_INVALID_CHARS from backend error", () => {
      const code = inferEditorErrorCode({
        response: { data: { error: "Contains unsupported characters" } }
      });
      expect(code).toBe("AI_INVALID_CHARS");
    });

    it("maps 400 to AI_REQUEST_FAILED", () => {
      const code = inferEditorErrorCode({ response: { status: 400 } });
      expect(code).toBe("AI_REQUEST_FAILED");
    });

    it("maps 401 to SESSION_EXPIRED", () => {
      const code = inferEditorErrorCode({ response: { status: 401 } });
      expect(code).toBe("SESSION_EXPIRED");
    });

    it("maps 403 to DOC_FORBIDDEN", () => {
      const code = inferEditorErrorCode({ response: { status: 403 } });
      expect(code).toBe("DOC_FORBIDDEN");
    });

    it("maps 404 to DOC_NOT_FOUND", () => {
      const code = inferEditorErrorCode({ response: { status: 404 } });
      expect(code).toBe("DOC_NOT_FOUND");
    });

    it("maps 413 to WORD_LIMIT_EXCEEDED", () => {
      const code = inferEditorErrorCode({ response: { status: 413 } });
      expect(code).toBe("WORD_LIMIT_EXCEEDED");
    });

    it("maps 500 to SERVER_ERROR", () => {
      const code = inferEditorErrorCode({ response: { status: 500 } });
      expect(code).toBe("SERVER_ERROR");
    });
  });

  describe("getEditorToastFromError", () => {
    it("prefers specific backend code if provided in response data", () => {
      const toast = getEditorToastFromError({
        response: { data: { errorCode: "AI_TEXT_TOO_SHORT" } }
      });
      expect(toast.code).toBe("AI_TEXT_TOO_SHORT");
    });

    it("parses client-side word limit errors from standard Error object", () => {
      const err = new Error("Text exceeds word-limit (500/200)");
      const toast = getEditorToastFromError(err);
      expect(toast.code).toBe("WORD_LIMIT_EXCEEDED");
      expect(toast.message).toBe("Text exceeds word limit of 500. Please shorten it.");
    });

    it("parses client-side empty text errors from standard Error object", () => {
      const err = new Error("Cannot run on empty text");
      const toast = getEditorToastFromError(err);
      expect(toast.code).toBe("EMPTY_TEXT_ERROR");
    });

    it("uses action context to refine unknown/server errors", () => {
      const err = { response: { status: 500 } }; // SERVER_ERROR
      const toast = getEditorToastFromError(err, { action: "save_content" });
      expect(toast.code).toBe("SAVE_FAILED");
    });

    it("uses action context to refine load errors", () => {
      const err = { response: { status: 500 } };
      const toast = getEditorToastFromError(err, { action: "load" });
      expect(toast.code).toBe("DOC_LOAD_FAILED");
    });

    it("uses action context to refine translate errors", () => {
      const err = { response: { status: 500 } };
      const toast = getEditorToastFromError(err, { action: "translate" });
      expect(toast.code).toBe("TRANSLATION_FAILED");
    });

    it("uses action context to refine correct errors", () => {
      const err = { response: { status: 500 } };
      const toast = getEditorToastFromError(err, { action: "correct" });
      expect(toast.code).toBe("CORRECTION_FAILED");
    });
  });
});
