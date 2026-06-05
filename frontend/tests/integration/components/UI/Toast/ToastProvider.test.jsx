import React, { useEffect } from "react";
import { render, screen, act, waitFor, fireEvent } from "@testing-library/react";
import { ToastProvider, useToast } from "@/components/UI/Toast/ToastProvider";
import * as networkStatus from "@/hooks/useNetworkStatus";

jest.mock("@/hooks/useNetworkStatus", () => ({
  useNetworkStatus: jest.fn(() => true),
}));

const TestComponent = ({ testAction }) => {
  const { showToast, removeToast } = useToast();

  useEffect(() => {
    if (testAction) testAction({ showToast, removeToast });
  }, [testAction, showToast, removeToast]);

  return <div>Test</div>;
};

describe("ToastProvider", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("throws error if useToast is used outside provider", () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const Comp = () => {
      useToast();
      return null;
    };
    expect(() => render(<Comp />)).toThrow("useToast must be used within <ToastProvider />");
    consoleSpy.mockRestore();
  });

  it("shows a toast and auto-removes it after duration", async () => {
    let api;
    render(
      <ToastProvider defaultDuration={1000}>
        <TestComponent testAction={(a) => { api = a; }} />
      </ToastProvider>
    );

    act(() => {
      api.showToast("Test message");
    });

    expect(screen.getByText("Test message")).toBeInTheDocument();

    act(() => {
      jest.runAllTimers();
    });

    await waitFor(() => {
      expect(screen.queryByText("Test message")).not.toBeInTheDocument();
    });
  });

  it("handles persistent toasts", () => {
    let api;
    render(
      <ToastProvider>
        <TestComponent testAction={(a) => { api = a; }} />
      </ToastProvider>
    );

    act(() => {
      api.showToast("Persist message", { persist: true });
    });

    expect(screen.getByText("Persist message")).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(10000); // long time
    });

    expect(screen.getByText("Persist message")).toBeInTheDocument();
  });

  it("deduplicates toasts with the same dedupeKey", () => {
    let api;
    render(
      <ToastProvider>
        <TestComponent testAction={(a) => { api = a; }} />
      </ToastProvider>
    );

    act(() => {
      api.showToast("Message 1", { dedupeKey: "key1" });
      api.showToast("Message 2", { dedupeKey: "key1" });
    });

    expect(screen.queryByText("Message 1")).not.toBeInTheDocument();
    expect(screen.getByText("Message 2")).toBeInTheDocument();
  });

  it("respects maxToasts limit", () => {
    let api;
    render(
      <ToastProvider maxToasts={2}>
        <TestComponent testAction={(a) => { api = a; }} />
      </ToastProvider>
    );

    act(() => {
      api.showToast("Msg 1");
      api.showToast("Msg 2");
      api.showToast("Msg 3");
    });

    expect(screen.queryByText("Msg 1")).not.toBeInTheDocument();
    expect(screen.getByText("Msg 2")).toBeInTheDocument();
    expect(screen.getByText("Msg 3")).toBeInTheDocument();
  });

  it("handles network offline and online transitions", () => {
    const { rerender } = render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      networkStatus.useNetworkStatus.mockReturnValue(false);
    });

    rerender(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    expect(screen.getByText("You are offline. Connection lost.")).toBeInTheDocument();

    act(() => {
      networkStatus.useNetworkStatus.mockReturnValue(true);
    });

    rerender(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    expect(screen.queryByText("You are offline. Connection lost.")).not.toBeInTheDocument();
    expect(screen.getByText("You are back online!")).toBeInTheDocument();
  });

  it("handles toast action clicks and closes toast", async () => {
    let api;
    const mockAction = jest.fn();
    render(
      <ToastProvider defaultDuration={1000}>
        <TestComponent testAction={(a) => { api = a; }} />
      </ToastProvider>
    );

    act(() => {
      api.showToast("Action msg", { actionLabel: "Undo", onAction: mockAction, persist: true });
    });

    const actionBtn = screen.getByRole("button", { name: "Undo" });
    fireEvent.click(actionBtn);

    expect(mockAction).toHaveBeenCalledTimes(1);

    // wait for removal since dismissOnAction is default true
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(screen.queryByText("Action msg")).not.toBeInTheDocument();
  });

  it("handles close button clicks", () => {
    let api;
    render(
      <ToastProvider defaultDuration={1000}>
        <TestComponent testAction={(a) => { api = a; }} />
      </ToastProvider>
    );

    act(() => {
      api.showToast("Close me", { persist: true });
    });

    const closeBtn = screen.getByRole("button", { name: "Dismiss notification" });
    fireEvent.click(closeBtn);

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(screen.queryByText("Close me")).not.toBeInTheDocument();
  });

  it("handles keyboard events to dismiss toasts", () => {
    let api;
    render(
      <ToastProvider defaultDuration={1000}>
        <TestComponent testAction={(a) => { api = a; }} />
      </ToastProvider>
    );

    act(() => {
      api.showToast("Key me", { persist: true });
    });

    const toastDiv = screen.getByRole("status");
    fireEvent.keyDown(toastDiv, { key: "Escape" });

    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(screen.queryByText("Key me")).not.toBeInTheDocument();
  });
});
