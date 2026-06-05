import { registerToastApi, showGlobalToast } from "@/components/UI/Toast/toastApi";

describe("toastApi", () => {
  afterEach(() => {
    // Reset internal state
    registerToastApi(null);
  });

  it("calls registered show function", () => {
    const mockShow = jest.fn();
    registerToastApi(mockShow);
    showGlobalToast("Hello", { severity: "info" });
    expect(mockShow).toHaveBeenCalledWith("Hello", { severity: "info" });
  });

  it("warns when no provider is mounted", () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    showGlobalToast("Skipped toast");
    expect(warnSpy).toHaveBeenCalledWith(
      "ToastProvider not ready; toast skipped:",
      "Skipped toast"
    );
    warnSpy.mockRestore();
  });
});
