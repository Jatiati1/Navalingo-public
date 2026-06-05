import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OtpVerificationModal from "@/features/security/OtpVerificationModal";
import { useAuth } from "@/context/AuthContext";

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

describe("OtpVerificationModal", () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();
  const mockOnResend = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      currentUser: { phoneNumber: "+12345678900" },
    });
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("renders correctly with masked phone number", () => {
    render(
      <OtpVerificationModal
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        loading={false}
      />
    );

    expect(screen.getByRole("heading", { name: /confirm your identity/i })).toBeInTheDocument();
    // +12345678900 -> +12*******00
    expect(screen.getByText(/\+12\*\*\*\*\*\*\*00/i)).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /6-digit verification code/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /verify/i })).toBeDisabled();
  });

  it("uses provided phoneNumber if passed", () => {
    render(
      <OtpVerificationModal
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        phoneNumber="+19998887777"
        loading={false}
      />
    );

    // +19998887777 -> +19*******77
    expect(screen.getByText(/\+19\*\*\*\*\*\*\*77/i)).toBeInTheDocument();
  });

  it("updates title if isChangingPhoneNumber is true", () => {
    render(
      <OtpVerificationModal
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        isChangingPhoneNumber={true}
        loading={false}
      />
    );

    expect(screen.getByRole("heading", { name: /verify new phone number/i })).toBeInTheDocument();
  });

  it("enables verify button only when 6 digits are entered", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <OtpVerificationModal
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        loading={false}
      />
    );

    const input = screen.getByRole("textbox", { name: /6-digit verification code/i });
    const verifyBtn = screen.getByRole("button", { name: /verify/i });

    await user.type(input, "123");
    expect(verifyBtn).toBeDisabled();

    await user.type(input, "456");
    expect(verifyBtn).toBeEnabled();

    // Try submitting
    await user.click(verifyBtn);
    expect(mockOnSuccess).toHaveBeenCalledWith("123456");
  });

  it("calls onCancel when cancel is clicked", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <OtpVerificationModal
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        loading={false}
      />
    );

    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("handles resend countdown and clicking resend", () => {
    render(
      <OtpVerificationModal
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        onResend={mockOnResend}
        loading={false}
      />
    );

    // Initially waiting for 30s
    expect(screen.getByText(/you can resend the code in 30s/i)).toBeInTheDocument();

    // Advance 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    // Button should appear
    const resendBtn = screen.getByRole("button", { name: /resend code/i });
    expect(resendBtn).toBeInTheDocument();

    // Click resend (need to use act because it triggers state update in useEffect for new timer)
    act(() => {
      resendBtn.click();
    });

    expect(mockOnResend).toHaveBeenCalledTimes(1);
    
    // Now waiting for 60s (2nd attempt)
    expect(screen.getByText(/you can resend the code in 60s/i)).toBeInTheDocument();
  });

  it("disables inputs when loading", () => {
    render(
      <OtpVerificationModal
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        loading={true}
      />
    );

    expect(screen.getByRole("textbox")).toBeDisabled();
    expect(screen.getByRole("button", { name: /verifying\.\.\./i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
  });

  it("shows error when submitting with less than 6 digits", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <OtpVerificationModal
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        loading={false}
      />
    );

    // Submit form without entering anything
    const form = screen.getByRole("textbox").closest("form");
    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(screen.getByText("Please enter the 6-digit code.")).toBeInTheDocument();
    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it("clears error when user types after an error", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <OtpVerificationModal
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        loading={false}
      />
    );

    // Submit empty to trigger error
    const form = screen.getByRole("textbox").closest("form");
    await act(async () => {
      form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    expect(screen.getByText("Please enter the 6-digit code.")).toBeInTheDocument();

    // Now type a digit — error should clear
    const input = screen.getByRole("textbox");
    await user.type(input, "1");
    expect(screen.queryByText("Please enter the 6-digit code.")).not.toBeInTheDocument();
  });

  it("shows max resend message after reaching limit", () => {
    render(
      <OtpVerificationModal
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        onResend={mockOnResend}
        loading={false}
      />
    );

    // Advance past initial 30s cooldown
    act(() => { jest.advanceTimersByTime(30000); });
    // First resend (attempt #2)
    act(() => { screen.getByRole("button", { name: /resend code/i }).click(); });

    // Advance past 60s cooldown
    act(() => { jest.advanceTimersByTime(60000); });
    // Second resend (attempt #3 = MAX)
    act(() => { screen.getByRole("button", { name: /resend code/i }).click(); });

    // Now should show "Maximum resend attempts reached."
    expect(screen.getByText("Maximum resend attempts reached.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /resend code/i })).not.toBeInTheDocument();
  });

  it("handles missing phoneNumber and currentUser.phoneNumber", () => {
    useAuth.mockReturnValue({ currentUser: {} });
    render(
      <OtpVerificationModal
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        loading={false}
      />
    );

    // Should still render without crashing
    expect(screen.getByRole("heading", { name: /confirm your identity/i })).toBeInTheDocument();
  });

  it("handles no onResend prop gracefully", () => {
    render(
      <OtpVerificationModal
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        loading={false}
      />
    );

    act(() => { jest.advanceTimersByTime(30000); });

    // Click resend without onResend prop — should not throw
    act(() => {
      screen.getByRole("button", { name: /resend code/i }).click();
    });

    // Should still show cooldown
    expect(screen.getByText(/you can resend the code in/i)).toBeInTheDocument();
  });

  it("filters non-digit characters from OTP input", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <OtpVerificationModal
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        loading={false}
      />
    );

    const input = screen.getByRole("textbox");
    await user.type(input, "12ab34cd56");
    expect(input).toHaveValue("123456");
  });
});
