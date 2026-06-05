import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CommandPalette from "@/features/search/components/CommandPalette";
import useSearch from "@/features/search/useSearch";

jest.mock("@/features/search/useSearch", () => jest.fn());

describe("CommandPalette", () => {
  const mockSetQuery = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useSearch.mockReturnValue({
      query: "",
      setQuery: mockSetQuery,
      results: [],
    });
  });

  it("is initially closed and renders nothing", () => {
    const { container } = render(<CommandPalette />);
    expect(container).toBeEmptyDOMElement();
  });

  it("opens when Ctrl+K is pressed", async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await user.keyboard("{Control>}k{/Control}");
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("opens when Cmd+K is pressed", async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    await user.keyboard("{Meta>}k{/Meta}");
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("closes when Escape is pressed", async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    // Open
    await user.keyboard("{Control>}k{/Control}");
    expect(screen.getByRole("combobox")).toBeInTheDocument();

    // Close
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("closes when backdrop is clicked", async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);

    // Open
    await user.keyboard("{Control>}k{/Control}");

    const backdrop = screen.getByRole("dialog");
    await user.click(backdrop);

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("renders results and allows keyboard navigation", async () => {
    const mockAction1 = jest.fn();
    const mockAction2 = jest.fn();

    useSearch.mockReturnValue({
      query: "test",
      setQuery: mockSetQuery,
      results: [
        { id: "1", label: "Result 1", action: mockAction1 },
        { id: "2", label: "Result 2", action: mockAction2 },
      ],
    });

    const user = userEvent.setup();
    render(<CommandPalette />);

    await user.keyboard("{Control>}k{/Control}");

    expect(screen.getByText("Result 1")).toBeInTheDocument();
    expect(screen.getByText("Result 2")).toBeInTheDocument();

    // Initially first is selected
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-activedescendant", "palette-opt-1");

    // Arrow down
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-activedescendant", "palette-opt-2");

    // Enter
    await user.keyboard("{Enter}");
    expect(mockAction2).toHaveBeenCalledTimes(1);

    // Should close after action
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("calls action on mouse click and closes", async () => {
    const mockAction1 = jest.fn();

    useSearch.mockReturnValue({
      query: "test",
      setQuery: mockSetQuery,
      results: [
        { id: "1", label: "Clickable Result", action: mockAction1 },
      ],
    });

    const user = userEvent.setup();
    render(<CommandPalette />);
    await user.keyboard("{Control>}k{/Control}");

    const option = screen.getByText("Clickable Result");

    // mousedown is used for click action in CommandPalette
    await act(async () => {
      const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
      option.dispatchEvent(mouseDownEvent);
    });

    expect(mockAction1).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("shows no results when empty", async () => {
    const user = userEvent.setup();
    render(<CommandPalette />);
    await user.keyboard("{Control>}k{/Control}");
    expect(screen.getByText("No results")).toBeInTheDocument();
  });
});
