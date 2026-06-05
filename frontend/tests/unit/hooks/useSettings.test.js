import { renderHook, act, waitFor } from "@testing-library/react";
import useSettings from "@/hooks/useSettings";
import { saveLanguagePreference, getLanguagePreference } from "@/api/userService";

jest.mock("@/api/userService", () => ({
  saveLanguagePreference: jest.fn(),
  getLanguagePreference: jest.fn(),
}));

describe("useSettings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with 'en' and fetch preference", async () => {
    getLanguagePreference.mockResolvedValue("es");
    const { result } = renderHook(() => useSettings());
    
    expect(result.current.language).toBe("en");
    
    await waitFor(() => {
      expect(result.current.language).toBe("es");
    });
  });

  it("should handle error in getLanguagePreference", async () => {
    getLanguagePreference.mockRejectedValue(new Error("err"));
    const { result } = renderHook(() => useSettings());
    
    await waitFor(() => {
      expect(result.current.language).toBe("en");
    });
  });

  it("should handle language change successfully", async () => {
    getLanguagePreference.mockResolvedValue("en");
    saveLanguagePreference.mockResolvedValue(undefined);
    
    const { result } = renderHook(() => useSettings());
    
    await waitFor(() => {
      expect(result.current.language).toBe("en");
    });

    await act(async () => {
      await result.current.handleLanguageChange("fr");
    });
    
    expect(result.current.language).toBe("fr");
    expect(saveLanguagePreference).toHaveBeenCalledWith("fr");
    expect(result.current.loading).toBe(false);
  });

  it("should handle error during language change", async () => {
    getLanguagePreference.mockResolvedValue("en");
    saveLanguagePreference.mockRejectedValue(new Error("err"));
    
    const { result } = renderHook(() => useSettings());
    
    await waitFor(() => {
      expect(result.current.language).toBe("en");
    });

    await act(async () => {
      await result.current.handleLanguageChange("de");
    });
    
    // State is still updated locally, but loading becomes false
    expect(result.current.language).toBe("de");
    expect(result.current.loading).toBe(false);
  });

  it("should default to 'en' when getLanguagePreference returns null", async () => {
    getLanguagePreference.mockResolvedValue(null);
    const { result } = renderHook(() => useSettings());

    await waitFor(() => {
      expect(result.current.language).toBe("en");
    });
  });
});
