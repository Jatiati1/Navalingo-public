import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Account from "@/components/Account/Account";
import { ToastProvider } from "@/components/UI/Toast/ToastProvider";

// Mock Firebase Auth and Recaptcha
jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({ currentUser: null })),
  onAuthStateChanged: jest.fn(() => jest.fn()),
  RecaptchaVerifier: jest.fn().mockImplementation(() => ({
    clear: jest.fn(),
  })),
  PhoneAuthProvider: jest.fn(),
}));

jest.mock("@/firebaseConfig", () => ({
  auth: { currentUser: null },
}));

// Mock AuthContext
// Mock Account Flow Hooks
jest.mock("@/components/Account/hooks/useEmailChangeFlow", () => ({
  useEmailChangeFlow: jest.fn(() => ({ step: "idle", loading: false, beginFlow: jest.fn(), cancelFlow: jest.fn(), updateEmail: jest.fn() }))
}));
jest.mock("@/components/Account/hooks/usePhoneChangeFlow", () => ({
  usePhoneChangeFlow: jest.fn(() => ({ step: "idle", loading: false, beginFlow: jest.fn(), cancelFlow: jest.fn(), updatePhone: jest.fn() }))
}));
jest.mock("@/components/Account/hooks/usePasswordChangeFlow", () => ({
  usePasswordChangeFlow: jest.fn(() => ({ step: "idle", loading: false, beginFlow: jest.fn(), cancelFlow: jest.fn(), updatePassword: jest.fn() }))
}));

jest.mock("@/hooks/useSettings", () => ({
  __esModule: true,
  default: jest.fn(() => ({ language: "en", handleLanguageChange: jest.fn(), loading: false }))
}));

const mockLogout = jest.fn();
jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    currentUser: { username: "TestUser", credits: { current: 10, max: 10 } },
    logout: mockLogout,
  }),
}));

const renderAccount = async (initialRoute = "/account") => {
  render(
    <ToastProvider>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/account" element={<Account />}>
            <Route path="profile" element={<div data-testid="profile-section">Profile Section</div>} />
            <Route path="subscription" element={<div data-testid="subscription-section">Subscription Section</div>} />
          </Route>
          <Route path="/auth" element={<div data-testid="auth-redirect">Auth Page</div>} />
        </Routes>
      </MemoryRouter>
    </ToastProvider>
  );
};

describe("<Account /> Integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the account layout with sidebar and header", async () => {
    const user = userEvent.setup();
    await renderAccount();
    
    // Header Search
    expect(screen.getByPlaceholderText(/search account settings/i)).toBeInTheDocument();
    
    // Sidebar items
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Security")).toBeInTheDocument();

    // Click user menu to see username and sign out
    const userMenuButton = screen.getByLabelText("User menu");
    await user.click(userMenuButton);

    expect(screen.getByText("TestUser")).toBeInTheDocument();
    expect(screen.getByText("Sign out")).toBeInTheDocument();

    // Trigger SearchBar's renderItem by typing in search
    const searchInput = screen.getByPlaceholderText(/search account settings/i);
    await user.type(searchInput, "sec");

    // "Security" should appear as a result
    expect(await screen.findByText("Security")).toBeInTheDocument();
  });

  it("handles logout click", async () => {
    const user = userEvent.setup();
    await renderAccount();

    const userMenuButton = screen.getByLabelText("User menu");
    await user.click(userMenuButton);

    const logoutButton = screen.getByText("Sign out");
    await user.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
    
    // Should navigate away (Auth page placeholder would appear if routing wasn't blocked by the mock)
    await waitFor(() => {
      expect(screen.getByTestId("auth-redirect")).toBeInTheDocument();
    });
  });

  it("renders nested outlet content", async () => {
    await renderAccount("/account/profile");
    expect(screen.getByTestId("profile-section")).toBeInTheDocument();
  });
});

import { useEmailChangeFlow } from "@/components/Account/hooks/useEmailChangeFlow";
import { usePhoneChangeFlow } from "@/components/Account/hooks/usePhoneChangeFlow";
import { usePasswordChangeFlow } from "@/components/Account/hooks/usePasswordChangeFlow";

describe("<Account /> Security Modals", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useEmailChangeFlow.mockReturnValue({ step: "idle", loading: false, beginFlow: jest.fn(), cancelFlow: jest.fn(), updateEmail: jest.fn() });
    usePhoneChangeFlow.mockReturnValue({ step: "idle", loading: false, beginFlow: jest.fn(), cancelFlow: jest.fn(), updatePhone: jest.fn() });
    usePasswordChangeFlow.mockReturnValue({ step: "idle", loading: false, beginFlow: jest.fn(), cancelFlow: jest.fn(), updatePassword: jest.fn() });
  });

  it("renders ChangePhoneModal on phoneFlow step input_new", async () => {
    usePhoneChangeFlow.mockReturnValue({ step: "input_new", cancelFlow: jest.fn(), sendNewPhoneOtp: jest.fn() });
    
    await renderAccount();
    // It should render "Change Phone Number" (the heading inside ChangePhoneModal)
    expect(screen.getByText(/change phone number/i)).toBeInTheDocument();
  });

  it("renders OtpVerificationModal on phoneFlow step otp_new", async () => {
    const mockSendNewPhoneOtp = jest.fn();
    usePhoneChangeFlow.mockReturnValue({ step: "otp_new", cancelFlow: jest.fn(), updatePhone: jest.fn(), sendNewPhoneOtp: mockSendNewPhoneOtp, newPhoneNumber: "1234567890" });
    
    await renderAccount();
    // Otp Verification modal renders
    expect(screen.getAllByText(/verify/i).length).toBeGreaterThan(0);
  });

  it("renders OtpVerificationModal on passwordFlow step otp", async () => {
    const mockBeginFlow = jest.fn();
    usePasswordChangeFlow.mockReturnValue({ step: "otp", cancelFlow: jest.fn(), verifyOtp: jest.fn(), beginFlow: mockBeginFlow });
    
    await renderAccount();
    // Otp Verification modal renders
    expect(screen.getAllByText(/verify/i).length).toBeGreaterThan(0);
  });

  it("renders ChangePasswordModal on passwordFlow step input_new", async () => {
    usePasswordChangeFlow.mockReturnValue({ step: "input_new", cancelFlow: jest.fn(), updatePassword: jest.fn() });
    
    await renderAccount();
    expect(screen.getByText(/create a new password/i)).toBeInTheDocument();
  });
});
