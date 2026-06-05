import { renderHook, act } from "@testing-library/react";
import { usePhoneChangeFlow } from "@/components/Account/hooks/usePhoneChangeFlow";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import * as userService from "@/api/userService";

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn()
}));

jest.mock("react-router-dom", () => ({
  useNavigate: jest.fn()
}));

jest.mock("@/api/userService", () => ({
  updateUserPhoneNumber: jest.fn()
}));

describe("usePhoneChangeFlow", () => {
  let mockUpdateUser;
  let mockSendOtp;
  let mockShowToast;
  let mockNavigate;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateUser = jest.fn();
    useAuth.mockReturnValue({
      updateUser: mockUpdateUser
    });

    mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);

    mockSendOtp = jest.fn();
    mockShowToast = jest.fn();
  });

  it("initializes and begins flow", () => {
    const { result } = renderHook(() => usePhoneChangeFlow(mockSendOtp, mockShowToast));
    expect(result.current.step).toBe("idle");

    act(() => {
      result.current.beginFlow();
    });

    expect(result.current.step).toBe("reauth");
  });

  it("progresses to input_new on reauth success", () => {
    const { result } = renderHook(() => usePhoneChangeFlow(mockSendOtp, mockShowToast));

    act(() => {
      result.current.onReauthSuccess();
    });

    expect(result.current.step).toBe("input_new");
  });

  it("sends new phone OTP successfully", async () => {
    mockSendOtp.mockResolvedValue();
    const { result } = renderHook(() => usePhoneChangeFlow(mockSendOtp, mockShowToast));

    await act(async () => {
      await result.current.sendNewPhoneOtp("+1987654321");
    });

    expect(mockSendOtp).toHaveBeenCalledWith("+1987654321");
    expect(result.current.newPhoneNumber).toBe("+1987654321");
    expect(result.current.step).toBe("otp_new");
  });

  it("handles send new phone OTP failure", async () => {
    mockSendOtp.mockRejectedValue(new Error("Twilio down"));
    const { result } = renderHook(() => usePhoneChangeFlow(mockSendOtp, mockShowToast));

    await act(async () => {
      await result.current.sendNewPhoneOtp("+1987654321");
    });

    expect(mockShowToast).toHaveBeenCalledWith("Twilio down");
  });

  it("updates phone successfully", async () => {
    userService.updateUserPhoneNumber.mockResolvedValue({});
    const { result } = renderHook(() => usePhoneChangeFlow(mockSendOtp, mockShowToast));

    // first set phone
    await act(async () => {
      await result.current.sendNewPhoneOtp("+1987654321");
    });

    await act(async () => {
      await result.current.updatePhone();
    });

    expect(userService.updateUserPhoneNumber).toHaveBeenCalledWith("+1987654321");
    expect(mockUpdateUser).toHaveBeenCalledWith({ phoneNumber: "+1987654321" });
    expect(mockShowToast).toHaveBeenCalledWith("Phone number updated successfully!");
    expect(result.current.step).toBe("idle");
  });

  it("handles update phone failure", async () => {
    userService.updateUserPhoneNumber.mockRejectedValue(new Error("Taken"));
    const { result } = renderHook(() => usePhoneChangeFlow(mockSendOtp, mockShowToast));

    await act(async () => {
      await result.current.updatePhone();
    });

    expect(mockShowToast).toHaveBeenCalledWith("Failed to update phone number. Please try again.");
  });

  it("navigates on forgot password", () => {
    const { result } = renderHook(() => usePhoneChangeFlow(mockSendOtp, mockShowToast));

    act(() => {
      result.current.onForgotPassword();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/recover-password");
    expect(result.current.step).toBe("idle");
  });

  it("cancels flow", () => {
    const { result } = renderHook(() => usePhoneChangeFlow(mockSendOtp, mockShowToast));
    
    act(() => {
      result.current.cancelFlow();
    });

    expect(result.current.step).toBe("idle");
    expect(result.current.loading).toBe(false);
  });
});
