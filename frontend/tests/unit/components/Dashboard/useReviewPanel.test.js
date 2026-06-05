import { renderHook, act } from "@testing-library/react";
import { useReviewPanel } from "@/components/Dashboard/useReviewPanel";

describe("useReviewPanel hook", () => {
  const originalText = "This are a test. It haz two errors.";
  const suggestions = [
    {
      id: "1",
      start: 5,
      end: 8,
      original_phrase: "are",
      suggested_phrase: "is",
      category: "Grammar",
      explanation: "Use 'is' for singular subjects."
    },
    {
      id: "2",
      start: 20,
      end: 23,
      original_phrase: "haz",
      suggested_phrase: "has",
      category: "Spelling",
      explanation: "Spelling error."
    }
  ];

  it("initializes with suggestions and live text", () => {
    const { result } = renderHook(() => useReviewPanel({ originalText, suggestions }));
    expect(result.current.liveText).toBe(originalText);
    expect(result.current.suggestions).toHaveLength(2);
    expect(result.current.activeId).toBe("1");
    expect(result.current.activeSuggestion.id).toBe("1");
  });

  it("handles empty suggestions properly", () => {
    const onListEmpty = jest.fn();
    const emptySuggestions = [];
    const { result } = renderHook(() => useReviewPanel({ originalText, suggestions: emptySuggestions, onListEmpty }));
    
    expect(result.current.suggestions).toHaveLength(0);
    expect(result.current.activeId).toBeNull();
  });

  it("handles accepting a single suggestion and remaps positions", () => {
    const { result } = renderHook(() => useReviewPanel({ originalText, suggestions }));
    
    act(() => {
      result.current.handleAccept();
    });

    // "are" -> "is" (length 3 -> 2, delta -1)
    // Next word "It haz" -> "haz" used to be at 20, now at 19.
    expect(result.current.liveText).toBe("This is a test. It haz two errors.");
    expect(result.current.suggestions).toHaveLength(1);
    expect(result.current.suggestions[0].id).toBe("2");
    expect(result.current.suggestions[0].start).toBe(19); // 20 - 1
    expect(result.current.activeId).toBe("2"); // active id shifts to next
  });

  it("handles rejecting a suggestion", () => {
    const onReject = jest.fn();
    const { result } = renderHook(() => useReviewPanel({ originalText, suggestions, onReject }));
    
    act(() => {
      result.current.handleReject();
    });

    expect(result.current.liveText).toBe(originalText);
    expect(result.current.suggestions).toHaveLength(1);
    expect(onReject).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "1",
        original: "are",
        replacement: "is",
      })
    );
  });

  it("handles accepting all suggestions", () => {
    const onFinish = jest.fn();
    const { result } = renderHook(() => useReviewPanel({ originalText, suggestions, onFinish }));
    
    act(() => {
      result.current.handleAcceptAll();
    });

    // Next should be applied from end to start to avoid shift issues.
    expect(onFinish).toHaveBeenCalledWith("This is a test. It has two errors.");
  });

  it("handles navigation between suggestions", () => {
    const { result } = renderHook(() => useReviewPanel({ originalText, suggestions }));
    
    expect(result.current.activeId).toBe("1");

    act(() => {
      result.current.handleNavigate(1); // next
    });
    expect(result.current.activeId).toBe("2");

    act(() => {
      result.current.handleNavigate(-1); // prev
    });
    expect(result.current.activeId).toBe("1");
  });

  it("calls onListEmpty when last suggestion is removed", () => {
    const onListEmpty = jest.fn();
    const { result, rerender } = renderHook((props) => useReviewPanel(props), {
      initialProps: { originalText, suggestions, onListEmpty }
    });

    act(() => {
      result.current.handleAccept(); // removes 1
    });
    act(() => {
      result.current.handleAccept(); // removes 2
    });

    expect(result.current.suggestions).toHaveLength(0);
    expect(onListEmpty).toHaveBeenCalledTimes(1);
  });

  it("handleNavigate is no-op with fewer than 2 suggestions", () => {
    const singleSuggestion = [suggestions[0]];
    const { result } = renderHook(() => useReviewPanel({ originalText, suggestions: singleSuggestion }));
    const initialActiveId = result.current.activeId;
    act(() => {
      result.current.handleNavigate(1);
    });
    expect(result.current.activeId).toBe(initialActiveId);
  });

  it("handles suggestions using replacement field instead of suggested_phrase", () => {
    const altSuggestions = [
      {
        id: "a1",
        start: 0,
        end: 4,
        original: "This",
        replacement: "That",
        category: "Style"
      }
    ];
    const onFinish = jest.fn();
    const { result } = renderHook(() => useReviewPanel({ originalText, suggestions: altSuggestions, onFinish }));

    expect(result.current.suggestions).toHaveLength(1);

    act(() => {
      result.current.handleAcceptAll();
    });

    expect(onFinish).toHaveBeenCalledWith("That are a test. It haz two errors.");
  });

  it("rejects without onReject callback", () => {
    const { result } = renderHook(() => useReviewPanel({ originalText, suggestions }));
    // No crash when onReject is undefined
    act(() => {
      result.current.handleReject();
    });
    expect(result.current.suggestions).toHaveLength(1);
  });

  it("handles suggestions without id field", () => {
    const noIdSuggestions = [
      {
        start: 5,
        end: 8,
        original_phrase: "are",
        suggested_phrase: "is",
      }
    ];
    const { result } = renderHook(() => useReviewPanel({ originalText, suggestions: noIdSuggestions }));
    expect(result.current.suggestions).toHaveLength(1);
    expect(result.current.suggestions[0].id).toBe("sugg-0-5");
  });

  it("handles reject with rule/ruleId/type fallbacks", () => {
    const onReject = jest.fn();
    const specialSuggestions = [
      {
        id: "r1",
        start: 5,
        end: 8,
        original_phrase: "are",
        suggested_phrase: "is",
        ruleId: "RULE_001",
        message: "Grammar rule triggered",
        type: "spelling"
      }
    ];
    const { result } = renderHook(() => useReviewPanel({ originalText, suggestions: specialSuggestions, onReject }));

    act(() => {
      result.current.handleReject();
    });

    expect(onReject).toHaveBeenCalledWith(
      expect.objectContaining({
        rule: "RULE_001",
        message: "Grammar rule triggered",
        type: "spelling"
      })
    );
  });

  it("wraps navigation around correctly", () => {
    const { result } = renderHook(() => useReviewPanel({ originalText, suggestions }));

    // Navigate backwards from first (should wrap to last)
    act(() => {
      result.current.handleNavigate(-1);
    });
    expect(result.current.activeId).toBe("2");

    // Navigate forward from last (should wrap to first)
    act(() => {
      result.current.handleNavigate(1);
    });
    expect(result.current.activeId).toBe("1");
  });
});
