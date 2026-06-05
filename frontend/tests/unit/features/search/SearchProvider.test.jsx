import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { SearchProvider, SearchContext } from "@/features/search/SearchProvider";
import userEvent from "@testing-library/user-event";

describe("SearchProvider", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const TestComponent = () => {
    const { query, setQuery, results, loading, error } = React.useContext(SearchContext);
    return (
      <div>
        <input 
          data-testid="search-input" 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
        />
        <div data-testid="loading">{loading ? "loading" : "idle"}</div>
        <div data-testid="error">{error ? error.message : "no-error"}</div>
        <ul data-testid="results">
          {results.map((r, i) => (
            <li key={i}>{r.title}</li>
          ))}
        </ul>
      </div>
    );
  };

  it("handles null adapter or short queries", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <SearchProvider adapter={null} minLength={2}>
        <TestComponent />
      </SearchProvider>
    );

    const input = screen.getByTestId("search-input");
    await act(async () => {
      await user.type(input, "a");
    });

    expect(screen.getByTestId("loading")).toHaveTextContent("idle");
    expect(screen.getByTestId("results").children).toHaveLength(0);
  });

  it("debounces and executes search", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const mockAdapter = {
      search: jest.fn().mockResolvedValue([{ title: "Result 1" }])
    };

    render(
      <SearchProvider adapter={mockAdapter} delay={200} minLength={2}>
        <TestComponent />
      </SearchProvider>
    );

    const input = screen.getByTestId("search-input");
    
    await act(async () => {
      await user.type(input, "te");
    });

    // Still idle before delay
    expect(screen.getByTestId("loading")).toHaveTextContent("idle");

    act(() => {
      jest.advanceTimersByTime(200);
    });

    expect(screen.getByTestId("loading")).toHaveTextContent("loading");

    await waitFor(() => {
      expect(screen.getByTestId("results").children).toHaveLength(1);
    });

    expect(screen.getByTestId("loading")).toHaveTextContent("idle");
    expect(screen.getByText("Result 1")).toBeInTheDocument();
  });

  it("ignores stale responses due to race conditions", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    
    // First call hangs, second call resolves fast
    let resolveFirst;
    const pFirst = new Promise(r => { resolveFirst = r; });
    const pSecond = Promise.resolve([{ title: "Result 2" }]);

    const mockAdapter = {
      search: jest.fn()
        .mockReturnValueOnce(pFirst)
        .mockReturnValueOnce(pSecond)
    };

    render(
      <SearchProvider adapter={mockAdapter} delay={200} minLength={2}>
        <TestComponent />
      </SearchProvider>
    );

    const input = screen.getByTestId("search-input");
    
    // Trigger first search
    await act(async () => {
      await user.type(input, "te");
    });
    act(() => { jest.advanceTimersByTime(200); });

    // Trigger second search
    await act(async () => {
      await user.type(input, "st");
    });
    act(() => { jest.advanceTimersByTime(200); });

    // Second search resolves immediately
    await waitFor(() => {
      expect(screen.getByText("Result 2")).toBeInTheDocument();
    });

    // Now resolve first search
    await act(async () => {
      resolveFirst([{ title: "Result 1" }]);
    });

    // Should NOT have Result 1 in the DOM
    expect(screen.queryByText("Result 1")).not.toBeInTheDocument();
  });

  it("handles errors and maps them to state", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const mockAdapter = {
      search: jest.fn().mockRejectedValue(new Error("API Error"))
    };

    render(
      <SearchProvider adapter={mockAdapter} delay={200} minLength={2}>
        <TestComponent />
      </SearchProvider>
    );

    const input = screen.getByTestId("search-input");
    
    await act(async () => {
      await user.type(input, "te");
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent("API Error");
    });
  });

  it("ignores stale error responses", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    let rejectFirst;
    const pFirst = new Promise((_, rej) => { rejectFirst = rej; });
    const pSecond = Promise.resolve([{ title: "Result 2" }]);

    const mockAdapter = {
      search: jest.fn()
        .mockReturnValueOnce(pFirst)
        .mockReturnValueOnce(pSecond)
    };

    render(
      <SearchProvider adapter={mockAdapter} delay={200} minLength={2}>
        <TestComponent />
      </SearchProvider>
    );

    const input = screen.getByTestId("search-input");
    
    await act(async () => {
      await user.type(input, "te");
    });
    act(() => { jest.advanceTimersByTime(200); });

    await act(async () => {
      await user.type(input, "st");
    });
    act(() => { jest.advanceTimersByTime(200); });

    await waitFor(() => {
      expect(screen.getByText("Result 2")).toBeInTheDocument();
    });

    // Reject first search
    await act(async () => {
      rejectFirst(new Error("Stale Error"));
    });

    // Should NOT show error
    expect(screen.getByTestId("error")).toHaveTextContent("no-error");
  });

  it("handles non-array results gracefully", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const mockAdapter = {
      search: jest.fn().mockResolvedValue({ notAnArray: true })
    };

    render(
      <SearchProvider adapter={mockAdapter} delay={200} minLength={2}>
        <TestComponent />
      </SearchProvider>
    );

    const input = screen.getByTestId("search-input");
    
    await act(async () => {
      await user.type(input, "te");
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("idle");
    });

    expect(screen.getByTestId("results").children).toHaveLength(0);
  });

  it("handles empty error gracefully", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const mockAdapter = {
      search: jest.fn().mockRejectedValue() // empty error
    };

    render(
      <SearchProvider adapter={mockAdapter} delay={200} minLength={2}>
        <TestComponent />
      </SearchProvider>
    );

    const input = screen.getByTestId("search-input");
    
    await act(async () => {
      await user.type(input, "te");
    });

    act(() => {
      jest.advanceTimersByTime(200);
    });

    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent("Search failed");
    });
  });
});
