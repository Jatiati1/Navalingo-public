import { renderHook, act } from "@testing-library/react";
import { usePasswordChangeFlow } from "@/components/Account/hooks/usePasswordChangeFlow";
import { useAuth } from "@/context/AuthContext";
import * as firebaseAuth from "firebase/auth";
import api from "@/api/axios";

jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn()
}));

jest.mock("firebase/auth", () => ({
  PhoneAuthProvider: {
    credential: jest.fn()
  },
  reauthenticateWithCredential: jest.fn()
}));

jest.mock("@/firebaseConfig", () => ({
  auth: { currentUser: {} }
}));

jest.mock("@/api/axios", () => ({
  put: jest.fn()
}));

describe("usePasswordChangeFlow", () => {
  let mockSendOtp;
  let mockShowToast;

  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      currentUser: { phoneNumber: "+1234567890" }
    });

    mockSendOtp = jest.fn();
    mockShowToast = jest.fn();
  });

  it("initializes with idle step", () => {
    const { result } = renderHook(() => usePasswordChangeFlow(mockSendOtp, mockShowToast));
    expect(result.current.step).toBe("idle");
  });

  it("begins flow and sends OTP", async () => {
    mockSendOtp.mockResolvedValue("vid123");
    const { result } = renderHook(() => usePasswordChangeFlow(mockSendOtp, mockShowToast));

    await act(async () => {
      await result.current.beginFlow();
    });

    expect(mockSendOtp).toHaveBeenCalledWith("+1234567890");
    expect(result.current.step).toBe("otp");
  });

  it("handles OTP sending failure", async () => {
    mockSendOtp.mockRejectedValue(new Error("Failed"));
    const { result } = renderHook(() => usePasswordChangeFlow(mockSendOtp, mockShowToast));

    await act(async () => {
      await result.current.beginFlow();
    });

    expect(mockShowToast).toHaveBeenCalledWith("Failed to send verification code. Please try again.");
    expect(result.current.step).toBe("idle");
  });

  it("verifies OTP successfully", async () => {
    mockSendOtp.mockResolvedValue("vid123");
    firebaseAuth.PhoneAuthProvider.credential.mockReturnValue("mock-cred");
    firebaseAuth.reauthenticateWithCredential.mockResolvedValue();

    const { result } = renderHook(() => usePasswordChangeFlow(mockSendOtp, mockShowToast));
    
    await act(async () => {
      await result.current.beginFlow();
    });

    await act(async () => {
      await result.current.verifyOtp("123456");
    });

    expect(firebaseAuth.PhoneAuthProvider.credential).toHaveBeenCalledWith("vid123", "123456");
    expect(result.current.step).toBe("input_new");
  });

  it("handles verify OTP failure", async () => {
    mockSendOtp.mockResolvedValue("vid123");
    firebaseAuth.reauthenticateWithCredential.mockRejectedValue(new Error("Wrong"));

    const { result } = renderHook(() => usePasswordChangeFlow(mockSendOtp, mockShowToast));
    await act(async () => {
      await result.current.beginFlow();
    });

    await act(async () => {
      await result.current.verifyOtp("000000");
    });

    expect(mockShowToast).toHaveBeenCalledWith("Incorrect code. Please try again.");
  });

  it("updates password successfully", async () => {
    api.put.mockResolvedValue({});
    const { result } = renderHook(() => usePasswordChangeFlow(mockSendOtp, mockShowToast));

    await act(async () => {
      await result.current.updatePassword("newpass123");
    });

    expect(api.put).toHaveBeenCalledWith("/users/password", { newPassword: "newpass123" });
    expect(mockShowToast).toHaveBeenCalledWith("Password updated successfully!");
    expect(result.current.step).toBe("idle");
  });

  it("cancels flow", () => {
    const { result } = renderHook(() => usePasswordChangeFlow(mockSendOtp, mockShowToast));
    
    act(() => {
      result.current.cancelFlow();
    });

    expect(result.current.step).toBe("idle");
    expect(result.current.loading).toBe(false);
  });

  it("handles updatePassword failure with server error message", async () => {
    api.put.mockRejectedValue({ response: { data: { error: "Password too weak" } } });
    const { result } = renderHook(() => usePasswordChangeFlow(mockSendOtp, mockShowToast));

    await act(async () => {
      await result.current.updatePassword("weak");
    });

    expect(mockShowToast).toHaveBeenCalledWith("Password too weak");
    expect(result.current.loading).toBe(false);
  });

  it("handles updatePassword failure without server error message", async () => {
    api.put.mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => usePasswordChangeFlow(mockSendOtp, mockShowToast));

    await act(async () => {
      await result.current.updatePassword("newpass");
    });

    expect(mockShowToast).toHaveBeenCalledWith("Failed to update password.");
    expect(result.current.loading).toBe(false);
  });
});
