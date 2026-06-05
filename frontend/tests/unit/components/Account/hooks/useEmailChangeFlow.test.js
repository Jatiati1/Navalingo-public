import { renderHook, act } from "@testing-library/react";
import { useEmailChangeFlow } from "@/components/Account/hooks/useEmailChangeFlow";
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

describe("useEmailChangeFlow", () => {
  let mockUpdateUser;
  let mockSendOtp;
  let mockShowToast;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdateUser = jest.fn();
    useAuth.mockReturnValue({
      currentUser: { phoneNumber: "+1234567890" },
      updateUser: mockUpdateUser
    });

    mockSendOtp = jest.fn();
    mockShowToast = jest.fn();
  });

  it("initializes with idle step", () => {
    const { result } = renderHook(() => useEmailChangeFlow(mockSendOtp, mockShowToast));
    expect(result.current.step).toBe("idle");
    expect(result.current.loading).toBe(false);
  });

  it("begins flow and sends OTP", async () => {
    mockSendOtp.mockResolvedValue("vid123");
    const { result } = renderHook(() => useEmailChangeFlow(mockSendOtp, mockShowToast));

    await act(async () => {
      await result.current.beginFlow();
    });

    expect(mockSendOtp).toHaveBeenCalledWith("+1234567890");
    expect(result.current.step).toBe("otp");
    expect(result.current.loading).toBe(false);
  });

  it("handles OTP sending failure", async () => {
    mockSendOtp.mockRejectedValue(new Error("Failed"));
    const { result } = renderHook(() => useEmailChangeFlow(mockSendOtp, mockShowToast));

    await act(async () => {
      await result.current.beginFlow();
    });

    expect(mockShowToast).toHaveBeenCalledWith("Failed to send verification code. Please try again.");
    expect(result.current.step).toBe("idle");
  });

  it("verifies OTP successfully", async () => {
    // Setup state by beginning flow first
    mockSendOtp.mockResolvedValue("vid123");
    firebaseAuth.PhoneAuthProvider.credential.mockReturnValue("mock-cred");
    firebaseAuth.reauthenticateWithCredential.mockResolvedValue();

    const { result } = renderHook(() => useEmailChangeFlow(mockSendOtp, mockShowToast));
    
    await act(async () => {
      await result.current.beginFlow();
    });

    await act(async () => {
      await result.current.verifyOtp("123456");
    });

    expect(firebaseAuth.PhoneAuthProvider.credential).toHaveBeenCalledWith("vid123", "123456");
    expect(firebaseAuth.reauthenticateWithCredential).toHaveBeenCalled();
    expect(result.current.step).toBe("input_new_email");
  });

  it("handles verify OTP failure", async () => {
    mockSendOtp.mockResolvedValue("vid123");
    firebaseAuth.reauthenticateWithCredential.mockRejectedValue(new Error("Wrong"));

    const { result } = renderHook(() => useEmailChangeFlow(mockSendOtp, mockShowToast));
    await act(async () => {
      await result.current.beginFlow();
    });

    await act(async () => {
      await result.current.verifyOtp("000000");
    });

    expect(mockShowToast).toHaveBeenCalledWith("Incorrect code. Please try again.");
  });

  it("submits new email and updates email", async () => {
    api.put.mockResolvedValue({});
    const { result } = renderHook(() => useEmailChangeFlow(mockSendOtp, mockShowToast));

    act(() => {
      result.current.submitNewEmail("test@test.com");
    });

    expect(result.current.newEmail).toBe("test@test.com");
    expect(result.current.step).toBe("confirm_new_email");

    act(() => {
      result.current.goBackToEmailInput();
    });

    expect(result.current.step).toBe("input_new_email");

    await act(async () => {
      await result.current.updateEmail();
    });

    expect(api.put).toHaveBeenCalledWith("/users/email", { newEmail: "test@test.com" });
    expect(mockUpdateUser).toHaveBeenCalledWith({ email: "test@test.com" });
    expect(mockShowToast).toHaveBeenCalledWith("Email updated successfully!");
    expect(result.current.step).toBe("idle");
  });

  it("handles updateEmail failure", async () => {
    api.put.mockRejectedValue({ response: { data: { error: "Email exists" } } });
    const { result } = renderHook(() => useEmailChangeFlow(mockSendOtp, mockShowToast));

    await act(async () => {
      await result.current.updateEmail();
    });

    expect(mockShowToast).toHaveBeenCalledWith("Email exists");
  });

  it("cancels flow", () => {
    const { result } = renderHook(() => useEmailChangeFlow(mockSendOtp, mockShowToast));
    
    act(() => {
      result.current.cancelFlow();
    });

    expect(result.current.step).toBe("idle");
    expect(result.current.loading).toBe(false);
  });

  it("handles updateEmail failure without server error message", async () => {
    api.put.mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useEmailChangeFlow(mockSendOtp, mockShowToast));

    await act(async () => {
      await result.current.updateEmail();
    });

    expect(mockShowToast).toHaveBeenCalledWith("Failed to update email.");
    expect(result.current.loading).toBe(false);
  });
});
