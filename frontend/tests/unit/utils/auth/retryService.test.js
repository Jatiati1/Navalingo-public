import { registerRetryHandler, triggerRetry } from "@/utils/auth/retryService";

describe("retryService", () => {
  it("should not fail if no handler is registered", () => {
    registerRetryHandler(null);
    expect(() => triggerRetry()).not.toThrow();
  });

  it("should trigger registered handler", () => {
    const handler = jest.fn();
    registerRetryHandler(handler);
    triggerRetry();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("should replace handler when re-registered", () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    registerRetryHandler(handler1);
    registerRetryHandler(handler2);
    triggerRetry();
    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalledTimes(1);
  });
});
