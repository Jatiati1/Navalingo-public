import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChangePhoneModal from "@/features/security/ChangePhoneModal";

describe("ChangePhoneModal", () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly with default state", () => {
    render(
      <ChangePhoneModal
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={false}
      />
    );

    expect(screen.getByRole("heading", { name: /change phone number/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /new phone number/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send code/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeEnabled();
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ChangePhoneModal
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={false}
      />
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("enables submit button and calls onSubmit when valid phone number is entered", async () => {
    const user = userEvent.setup();
    render(
      <ChangePhoneModal
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={false}
      />
    );

    const phoneInput = screen.getByRole("textbox", { name: /new phone number/i });
    
    // Type a valid US phone number
    await user.type(phoneInput, "2125551234");

    const submitButton = screen.getByRole("button", { name: /send code/i });
    
    await waitFor(() => {
      expect(submitButton).toBeEnabled();
    });

    await user.click(submitButton);

    // react-phone-number-input formats it as E.164 by default if country is US
    expect(mockOnSubmit).toHaveBeenCalledWith("+12125551234");
  });

  it("disables buttons and shows loading text when loading is true", () => {
    render(
      <ChangePhoneModal
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        loading={true}
      />
    );

    expect(screen.getByRole("button", { name: /sending\.\.\./i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
  });
});
