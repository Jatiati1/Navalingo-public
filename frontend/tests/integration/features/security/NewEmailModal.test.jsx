import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NewEmailModal from "@/features/security/NewEmailModal";

describe("NewEmailModal", () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with default state", () => {
    render(
      <NewEmailModal
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={false}
      />
    );

    expect(screen.getByRole("heading", { name: /change your email address/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /new email address/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeEnabled();
  });

  it("calls onCancel when Cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <NewEmailModal
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={false}
      />
    );

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("enables submit button and calls onSubmit with valid email", async () => {
    const user = userEvent.setup();
    render(
      <NewEmailModal
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={false}
      />
    );

    const emailInput = screen.getByRole("textbox", { name: /new email address/i });
    await user.type(emailInput, "test@example.com");

    const submitButton = screen.getByRole("button", { name: /continue/i });
    
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });

    await user.click(submitButton);
    expect(mockOnSubmit).toHaveBeenCalledWith("test@example.com");
  });

  it("keeps submit disabled and shows no error visually until validation requires it (relies on valid state)", async () => {
    const user = userEvent.setup();
    render(
      <NewEmailModal
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={false}
      />
    );

    const emailInput = screen.getByRole("textbox", { name: /new email address/i });
    await user.type(emailInput, "invalid-email");

    const submitButton = screen.getByRole("button", { name: /continue/i });
    expect(submitButton).toBeDisabled();
  });

  it("disables buttons and shows loading text when loading is true", () => {
    render(
      <NewEmailModal
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={true}
      />
    );

    expect(screen.getByRole("button", { name: /continuing\.\.\./i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
  });

  it("clears error when user types after validation error", async () => {
    const user = userEvent.setup();
    render(
      <NewEmailModal
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={false}
      />
    );

    const emailInput = screen.getByRole("textbox", { name: /new email address/i });

    // Type invalid email and force submit by dispatching form submit
    await user.type(emailInput, "bad");
    const form = emailInput.closest("form");
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));

    await waitFor(() => {
      expect(screen.getByText("Please enter a valid email address.")).toBeInTheDocument();
    });

    // Now type more — error should clear
    await user.type(emailInput, "@");
    expect(screen.queryByText("Please enter a valid email address.")).not.toBeInTheDocument();
  });

  it("sets aria-invalid when email is entered but invalid", async () => {
    const user = userEvent.setup();
    render(
      <NewEmailModal
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={false}
      />
    );

    const emailInput = screen.getByRole("textbox", { name: /new email address/i });
    await user.type(emailInput, "notanemail");

    expect(emailInput).toHaveAttribute("aria-invalid", "true");
  });
});
