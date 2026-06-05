import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChangePasswordModal from "@/features/security/ChangePasswordModal";

describe("ChangePasswordModal", () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with default state", () => {
    render(
      <ChangePasswordModal
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={false}
      />
    );

    expect(screen.getByRole("heading", { name: /create a new password/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("New Password")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Confirm New Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /update password/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeEnabled();
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ChangePasswordModal
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={false}
      />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("shows error when passwords do not match", async () => {
    const user = userEvent.setup();
    render(
      <ChangePasswordModal
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={false}
      />
    );

    const newPasswordInput = screen.getByPlaceholderText("New Password");
    const confirmPasswordInput = screen.getByPlaceholderText("Confirm New Password");

    await user.type(newPasswordInput, "Valid123!");
    await user.type(confirmPasswordInput, "Valid123!Mismatch");

    const submitButton = screen.getByRole("button", { name: /update password/i });
    // It shouldn't be disabled if it's filled and meets length/complexity, but we need to click it to trigger submit.
    // Actually, `canSubmit` requires `isPasswordValid` to be true. "Valid123!" is valid.
    await user.click(submitButton);

    expect(await screen.findByRole("alert")).toHaveTextContent("Passwords do not match. Please try again.");
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with new password when inputs are valid and match", async () => {
    const user = userEvent.setup();
    render(
      <ChangePasswordModal
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={false}
      />
    );

    const newPasswordInput = screen.getByPlaceholderText("New Password");
    const confirmPasswordInput = screen.getByPlaceholderText("Confirm New Password");

    await user.type(newPasswordInput, "Valid123!");
    await user.type(confirmPasswordInput, "Valid123!");

    const submitButton = screen.getByRole("button", { name: /update password/i });
    
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });

    await user.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith("Valid123!");
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });

  it("disables buttons and shows updating text when loading", () => {
    render(
      <ChangePasswordModal
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={true}
      />
    );

    expect(screen.getByRole("button", { name: /updating\.\.\./i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
  });
});
