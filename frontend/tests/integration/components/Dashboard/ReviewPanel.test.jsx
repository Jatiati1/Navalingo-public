import React from "react";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReviewPanel from "@/components/Dashboard/ReviewPanel";

describe("<ReviewPanel /> Integration", () => {
  const originalText = "This are a test.";
  const suggestions = [
    {
      id: "1",
      start: 5,
      end: 8,
      original_phrase: "are",
      suggested_phrase: "is",
      category: "Grammar",
      explanation: "Use 'is' for singular."
    }
  ];

  it("renders suggestions and allows accepting", async () => {
    const onFinish = jest.fn();
    const user = userEvent.setup();

    render(
      <ReviewPanel
        originalText={originalText}
        suggestions={suggestions}
        isLoading={false}
        onFinish={onFinish}
      />
    );

    // Should render the suggestion category
    expect(screen.getByText("Grammar")).toBeInTheDocument();
    
    // Accept the suggestion
    const acceptBtn = screen.getByText("Accept");
    await user.click(acceptBtn);

    // When the panel has no suggestions left, it should call onFinish via setTimeout
    await new Promise((r) => setTimeout(r, 10));

    expect(onFinish).toHaveBeenCalledWith("This is a test.");
  });

  it("allows rejecting a suggestion", async () => {
    const onReject = jest.fn();
    const onFinish = jest.fn();
    const user = userEvent.setup();

    render(
      <ReviewPanel
        originalText={originalText}
        suggestions={suggestions}
        isLoading={false}
        onReject={onReject}
        onFinish={onFinish}
      />
    );

    const rejectBtn = screen.getByText("Reject");
    await user.click(rejectBtn);

    expect(onReject).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "1",
        original: "are",
        replacement: "is",
      })
    );
  });

  it("handles 'Accept All'", async () => {
    const onFinish = jest.fn();
    const user = userEvent.setup();

    render(
      <ReviewPanel
        originalText={originalText}
        suggestions={suggestions}
        isLoading={false}
        onFinish={onFinish}
      />
    );

    const acceptAllBtn = screen.getByText("Accept All");
    await user.click(acceptAllBtn);

    expect(onFinish).toHaveBeenCalledWith("This is a test.");
  });

  it("closes cleanly when 'X' is clicked", async () => {
    const onClear = jest.fn();
    const onFinish = jest.fn();
    const user = userEvent.setup();

    render(
      <ReviewPanel
        originalText={originalText}
        suggestions={suggestions}
        isLoading={false}
        onClear={onClear}
        onFinish={onFinish}
      />
    );

    const closeBtn = screen.getByRole("button", { name: "Close review" });
    await user.click(closeBtn);

    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onFinish).toHaveBeenCalledWith(originalText);
  });

  it("returns null if no suggestions and not loading", () => {
    const onFinish = jest.fn();
    const { container } = render(
      <ReviewPanel
        originalText={originalText}
        suggestions={[]}
        isLoading={false}
        onFinish={onFinish}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
