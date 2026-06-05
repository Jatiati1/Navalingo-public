import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConfirmEmailModal from "@/features/security/ConfirmEmailModal";

describe("ConfirmEmailModal", () => {
  const mockOnConfirm = jest.fn();
  const mockOnGoBack = jest.fn();
  const mockOnCancel = jest.fn();
  const testEmail = "test@example.com";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with provided email", () => {
    render(
      <ConfirmEmailModal
        email={testEmail}
        onConfirm={mockOnConfirm}
        onGoBack={mockOnGoBack}
        onCancel={mockOnCancel}
        loading={false}
      />
    );

    expect(screen.getByRole("heading", { name: /confirm new email/i })).toBeInTheDocument();
    expect(screen.getByText(testEmail)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirm & update/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /go back/i })).toBeEnabled();
  });

  it("calls onGoBack when Go Back button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ConfirmEmailModal
        email={testEmail}
        onConfirm={mockOnConfirm}
        onGoBack={mockOnGoBack}
        loading={false}
      />
    );

    await user.click(screen.getByRole("button", { name: /go back/i }));
    expect(mockOnGoBack).toHaveBeenCalledTimes(1);
  });

  it("calls onConfirm when Confirm & Update button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ConfirmEmailModal
        email={testEmail}
        onConfirm={mockOnConfirm}
        onGoBack={mockOnGoBack}
        loading={false}
      />
    );

    await user.click(screen.getByRole("button", { name: /confirm & update/i }));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it("disables buttons and shows updating text when loading", () => {
    render(
      <ConfirmEmailModal
        email={testEmail}
        onConfirm={mockOnConfirm}
        onGoBack={mockOnGoBack}
        loading={true}
      />
    );

    expect(screen.getByRole("button", { name: /updating\.\.\./i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /go back/i })).toBeDisabled();
  });
});
