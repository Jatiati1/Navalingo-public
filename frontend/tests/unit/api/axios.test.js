import axios from "axios";

// Mock axios
const mockApi = {
  get: jest.fn(),
  request: jest.fn(),
  defaults: { baseURL: "https://example.com/api" },
  interceptors: {
    request: {
      handlers: [],
      use: jest.fn((fulfilled, rejected) => {
        mockApi.interceptors.request.handlers.push({ fulfilled, rejected });
      }),
    },
    response: {
      handlers: [],
      use: jest.fn((fulfilled, rejected) => {
        mockApi.interceptors.response.handlers.push({ fulfilled, rejected });
      }),
    },
  },
};

jest.mock("axios", () => ({
  create: jest.fn(() => mockApi),
}));

const originalWindowLocation = global.window.location;

describe("axios api", () => {
  beforeEach(() => {
    jest.resetModules();
    localStorage.clear();
    mockApi.interceptors.request.handlers = [];
    mockApi.interceptors.response.handlers = [];
    mockApi.get.mockClear();
    mockApi.request.mockClear();
  });

  describe("with USE_BEARER = false", () => {
    let api, setSessionToken, fetchCsrfToken, getApiBasePath;

    beforeEach(async () => {
      process.env.VITE_USE_BEARER = "false";
      process.env.VITE_API_URL = "https://example.com/api";
      
      const axiosModule = require("@/api/axios");
      api = axiosModule.default;
      setSessionToken = axiosModule.setSessionToken;
      fetchCsrfToken = axiosModule.fetchCsrfToken;
      getApiBasePath = axiosModule.getApiBasePath;
    });

    it("setSessionToken clears token when USE_BEARER is false", () => {
      setSessionToken("test-token");
      expect(localStorage.getItem("session_token")).toBeNull();
    });

    it("getApiBasePath returns absolute url", () => {
      delete global.window.location;
      global.window = Object.create(window);
      global.window.location = { origin: "https://app.example.com" };

      expect(getApiBasePath()).toBe("https://example.com/api");

      global.window.location = originalWindowLocation;
    });

    it("getApiBasePath catches URL parse error and returns /api", () => {
      const origURL = global.URL;
      global.URL = jest.fn(() => { throw new Error("bad url"); });

      expect(getApiBasePath()).toBe("/api");

      global.URL = origURL;
    });

    it("adds X-CSRF-Token on mutating requests but not Authorization", async () => {
      // Mock fetchCsrfToken by resolving api.get
      mockApi.get.mockResolvedValueOnce({ data: { csrfToken: "csrf-123" } });
      
      // Simulate request interceptor for a POST request
      const config = { method: "post", headers: {} };
      const reqHandler = mockApi.interceptors.request.handlers[0].fulfilled;
      
      const newConfig = await reqHandler(config);
      
      expect(newConfig.headers["X-CSRF-Token"]).toBe("csrf-123");
      expect(newConfig.headers.Authorization).toBeUndefined();
    });

    it("handles concurrent CSRF fetch calls", async () => {
      mockApi.get.mockImplementationOnce(() => new Promise((resolve) => setTimeout(() => resolve({ data: { csrfToken: "csrf-456" } }), 50)));
      
      await fetchCsrfToken(true); // force reset

      const p1 = fetchCsrfToken();
      const p2 = fetchCsrfToken();
      
      const [token1, token2] = await Promise.all([p1, p2]);
      
      expect(token1).toBe("csrf-456");
      expect(token2).toBe("csrf-456");
      expect(mockApi.get).toHaveBeenCalledTimes(1);
    });

    it("retries on 403 and refetches CSRF", async () => {
      mockApi.get.mockResolvedValueOnce({ data: { csrfToken: "new-csrf" } });
      mockApi.request.mockResolvedValueOnce({ success: true });

      const resHandler = mockApi.interceptors.response.handlers[0].rejected;
      const error = { response: { status: 403 }, config: { headers: {} } };
      
      const res = await resHandler(error);
      
      expect(mockApi.get).toHaveBeenCalledWith("/auth/csrf-token");
      expect(mockApi.request).toHaveBeenCalledWith(expect.objectContaining({
        headers: { "X-CSRF-Token": "new-csrf" }
      }));
      expect(res).toEqual({ success: true });
    });

    it("passes through 403 if it fails again (no config)", async () => {
      const resHandler = mockApi.interceptors.response.handlers[0].rejected;
      const error = { response: { status: 403 } }; // no config
      
      await expect(resHandler(error)).rejects.toEqual(error);
    });

    it("does not fetch CSRF token for GET requests", async () => {
      const config = { method: "get", headers: {} };
      const reqHandler = mockApi.interceptors.request.handlers[0].fulfilled;
      
      const newConfig = await reqHandler(config);
      
      expect(newConfig.headers["X-CSRF-Token"]).toBeUndefined();
      expect(mockApi.get).not.toHaveBeenCalled();
    });
  });



  describe("request interceptor error handling", () => {
    it("handles request interceptor error", async () => {
      process.env.VITE_USE_BEARER = "false";
      require("@/api/axios");
      const reqError = mockApi.interceptors.request.handlers[0].rejected;
      await expect(reqError(new Error("Request Error"))).rejects.toThrow("Request Error");
    });
    it("handles response interceptor success", async () => {
      process.env.VITE_USE_BEARER = "false";
      require("@/api/axios");
      const resSuccess = mockApi.interceptors.response.handlers[0].fulfilled;
      expect(resSuccess({ data: "ok" })).toEqual({ data: "ok" });
    });
  });
});
