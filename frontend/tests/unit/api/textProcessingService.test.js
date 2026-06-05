// tests/api/textProcessingService.test.js
import processText, {
  translateText,
  correctGrammar,
  correctLive,
} from "@/api/textProcessingService";
import axiosInstance from "@/api/axios";

// Mock axiosInstance
jest.mock("@/api/axios", () => ({
  post: jest.fn(),
}));

describe("TextProcessingService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- processText ---
  describe("processText", () => {
    const text = "<p>Test content.</p>";
    const action = "translate";
    const sourceLang = "en";
    const targetLang = "es";
    const maxWords = 500;

    it("should process text successfully and return data", async () => {
      const mockResponseData = {
        result: "<p>Contenido de prueba.</p>",
      };
      axiosInstance.post.mockResolvedValue({ data: mockResponseData });

      const result = await processText(text, action, sourceLang, targetLang, maxWords);

      expect(axiosInstance.post).toHaveBeenCalledWith("/process-text", {
        text,
        action,
        sourceLang,
        targetLang,
        maxWords,
        extra: {},
      });
      expect(result).toEqual(mockResponseData);
    });

    it("should throw error if API call fails", async () => {
      const apiError = new Error("API processing error");
      axiosInstance.post.mockRejectedValue(apiError);

      await expect(
        processText(text, action, sourceLang, targetLang, maxWords),
      ).rejects.toThrow(apiError);
    });
  });

  // --- translateText ---
  describe("translateText", () => {
    const text = "<p>Hello world.</p>";
    const targetLang = "es";
    const maxWords = 500;
    const mockTranslatedData = { result: "<p>Hola mundo.</p>" };

    it('should call processText with "translate" action and correct parameters', async () => {
      axiosInstance.post.mockResolvedValue({ data: mockTranslatedData });

      const result = await translateText(text, null, targetLang, maxWords, null);

      expect(axiosInstance.post).toHaveBeenCalledWith("/process-text", {
        text,
        action: "translate",
        sourceLang: null,
        targetLang,
        maxWords,
        extra: {},
      });
      expect(result).toEqual(mockTranslatedData);
    });

    it('should call processText with "translate-snippet" if snippet is provided', async () => {
      axiosInstance.post.mockResolvedValue({ data: mockTranslatedData });

      const snippet = "Hello";
      await translateText(text, snippet, targetLang, maxWords, null);

      expect(axiosInstance.post).toHaveBeenCalledWith("/process-text", {
        text,
        action: "translate-snippet",
        sourceLang: null,
        targetLang,
        maxWords,
        extra: { snippet },
      });
    });
  });

  // --- correctGrammar ---
  describe("correctGrammar", () => {
    const text = "<p>This have bad grammar.</p>";
    const maxWords = 500;
    const mockCorrectedData = { result: "<p>This has bad grammar.</p>" };

    it('should call processText with "correct-live" action and correct parameters', async () => {
      axiosInstance.post.mockResolvedValue({ data: mockCorrectedData });

      const result = await correctGrammar(text, maxWords);

      expect(axiosInstance.post).toHaveBeenCalledWith("/process-text", {
        text,
        action: "correct-live",
        sourceLang: null,
        targetLang: null,
        maxWords,
        extra: { rejectionList: [] },
      });
      expect(result).toEqual(mockCorrectedData);
    });

    it('should normalize various formats of rejectionList', async () => {
      axiosInstance.post.mockResolvedValue({ data: mockCorrectedData });

      const rejectionList = [
        "10-20", // string format
        { rangeKey: "30-40" }, // rangeKey format
        { start: 50, end: 60 }, // start/end format
        null, // invalid format to be filtered
        "10-20" // duplicate to be deduped
      ];

      await correctGrammar(text, maxWords, rejectionList);

      expect(axiosInstance.post).toHaveBeenCalledWith("/process-text", {
        text,
        action: "correct-live",
        sourceLang: null,
        targetLang: null,
        maxWords,
        extra: { rejectionList: ["10-20", "30-40", "50-60"] },
      });
    });
  });

  describe("correctLive", () => {
    it("should process text with correct-live action", async () => {
      axiosInstance.post.mockResolvedValue({ data: { result: "ok" } });
      await correctLive("test text", "en", 100);
      expect(axiosInstance.post).toHaveBeenCalledWith("/process-text", expect.objectContaining({
        action: "correct-live",
        sourceLang: "en",
        targetLang: "en",
        maxWords: 100,
      }));
    });
  });

  describe("processText missing maxWords", () => {
    it("should throw ReferenceError if maxWords is null or undefined", async () => {
      await expect(processText("test", "translate", "en", "es", null)).rejects.toThrow(ReferenceError);
    });
  });
});
