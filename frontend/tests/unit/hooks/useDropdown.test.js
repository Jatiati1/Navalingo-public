import { renderHook, act } from "@testing-library/react";
import useDropdown from "@/hooks/useDropdown";
import { fireEvent } from "@testing-library/react";

describe("useDropdown", () => {
  it("starts closed by default", () => {
    const { result } = renderHook(() => useDropdown());
    expect(result.current.isOpen).toBe(false);
  });

  it("can start open with initialState=true", () => {
    const { result } = renderHook(() => useDropdown(true));
    expect(result.current.isOpen).toBe(true);
  });

  it("toggles open/close", () => {
    const { result } = renderHook(() => useDropdown());

    act(() => { result.current.toggle(); });
    expect(result.current.isOpen).toBe(true);

    act(() => { result.current.toggle(); });
    expect(result.current.isOpen).toBe(false);
  });

  it("open() and close() work independently", () => {
    const { result } = renderHook(() => useDropdown());

    act(() => { result.current.open(); });
    expect(result.current.isOpen).toBe(true);

    act(() => { result.current.close(); });
    expect(result.current.isOpen).toBe(false);
  });

  it("closes on outside click when open", () => {
    const { result } = renderHook(() => useDropdown(true));

    // Simulate outside click
    act(() => {
      fireEvent.mouseDown(document.body);
    });

    expect(result.current.isOpen).toBe(false);
  });

  it("does not close when clicking inside dropdown ref", () => {
    const { result } = renderHook(() => useDropdown(true));

    // Create a mock element and attach to dropdownRef
    const dropdownEl = document.createElement("div");
    document.body.appendChild(dropdownEl);
    Object.defineProperty(result.current.dropdownRef, "current", {
      value: dropdownEl,
      writable: true,
    });

    act(() => {
      fireEvent.mouseDown(dropdownEl);
    });

    expect(result.current.isOpen).toBe(true);

    document.body.removeChild(dropdownEl);
  });

  it("does not close when clicking inside button ref", () => {
    const { result } = renderHook(() => useDropdown(true));

    const buttonEl = document.createElement("button");
    document.body.appendChild(buttonEl);
    Object.defineProperty(result.current.buttonRef, "current", {
      value: buttonEl,
      writable: true,
    });

    act(() => {
      fireEvent.mouseDown(buttonEl);
    });

    expect(result.current.isOpen).toBe(true);

    document.body.removeChild(buttonEl);
  });
});
