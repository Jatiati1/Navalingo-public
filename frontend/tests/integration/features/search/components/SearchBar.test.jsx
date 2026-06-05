import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SearchBar from "@/features/search/components/SearchBar";
import useSearch from "@/features/search/useSearch";

jest.mock("@/features/search/useSearch", () => jest.fn());

describe("SearchBar", () => {
  const mockSetQuery = jest.fn();
  const mockOnQueryChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useSearch.mockReturnValue({
      query: "",
      setQuery: mockSetQuery,
      results: [],
    });
  });

  it("renders input field correctly", () => {
    render(<SearchBar placeholder="Find things" />);
    expect(screen.getByPlaceholderText("Find things")).toBeInTheDocument();
  });

  it("calls setQuery and onQueryChange when typing", async () => {
    const user = userEvent.setup();
    render(<SearchBar onQueryChange={mockOnQueryChange} />);
    
    const input = screen.getByRole("combobox");
    await user.type(input, "a");

    expect(mockSetQuery).toHaveBeenCalledWith("a");
    expect(mockOnQueryChange).toHaveBeenCalledWith("a");
  });

  it("shows clear button when query exists, and clears when clicked", async () => {
    useSearch.mockReturnValue({
      query: "hello",
      setQuery: mockSetQuery,
      results: [],
    });

    const user = userEvent.setup();
    render(<SearchBar onQueryChange={mockOnQueryChange} />);
    
    const clearBtn = screen.getByRole("button", { name: /clear search/i });
    expect(clearBtn).toBeInTheDocument();

    await user.click(clearBtn);

    expect(mockSetQuery).toHaveBeenCalledWith("");
    expect(mockOnQueryChange).toHaveBeenCalledWith("");
  });

  it("renders dropdown with results", () => {
    useSearch.mockReturnValue({
      query: "test",
      setQuery: mockSetQuery,
      results: [
        { id: "1", label: "Item 1" },
        { id: "2", label: "Item 2" },
      ],
    });

    render(<SearchBar />);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 2")).toBeInTheDocument();
  });

  it("renders grouped results correctly", () => {
    useSearch.mockReturnValue({
      query: "test",
      setQuery: mockSetQuery,
      results: [
        { id: "1", label: "Item 1", section: "Docs" },
        { id: "2", label: "Item 2", section: "Docs" },
        { id: "3", label: "Item 3", section: "Settings" },
      ],
    });

    render(<SearchBar />);
    expect(screen.getByText("Docs")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Item 1")).toBeInTheDocument();
    expect(screen.getByText("Item 3")).toBeInTheDocument();
  });

  it("allows keyboard navigation within results", async () => {
    const mockAction = jest.fn();
    useSearch.mockReturnValue({
      query: "test",
      setQuery: mockSetQuery,
      results: [
        { id: "1", label: "Item 1" },
        { id: "2", label: "Item 2", action: mockAction },
      ],
    });

    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByRole("combobox");
    
    // Focus input
    await user.click(input);
    
    // First item selected by default
    expect(input).toHaveAttribute("aria-activedescendant", "sb-opt-1");

    // Arrow down
    await user.keyboard("{ArrowDown}");
    expect(input).toHaveAttribute("aria-activedescendant", "sb-opt-2");

    // Enter
    await user.keyboard("{Enter}");
    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it("calls action on mouse down", async () => {
    const mockAction = jest.fn();
    useSearch.mockReturnValue({
      query: "test",
      setQuery: mockSetQuery,
      results: [
        { id: "1", label: "Item 1", action: mockAction },
      ],
    });

    render(<SearchBar />);

    const item = screen.getByText("Item 1");

    act(() => {
      const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
      item.dispatchEvent(mouseDownEvent);
    });

    expect(mockAction).toHaveBeenCalledTimes(1);
  });

  it("shows empty message if no results", () => {
    useSearch.mockReturnValue({
      query: "test",
      setQuery: mockSetQuery,
      results: [],
    });

    render(<SearchBar emptyMessage="Nothing found" />);
    expect(screen.getByText("Nothing found")).toBeInTheDocument();
  });
});
