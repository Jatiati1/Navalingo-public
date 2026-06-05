import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import AccountSection from "@/components/Account/sections/AccountSection/AccountSection";
import { ToastProvider } from "@/components/UI/Toast/ToastProvider";
import { updateUserProfile } from "@/api/userService";
import api from "@/api/axios";

// Mock dependencies
jest.mock("@/api/userService", () => ({
  updateUserProfile: jest.fn(),
}));

jest.mock("@/api/axios", () => ({
  post: jest.fn(),
}));

// Mock react-router context
const mockHandleLanguageChange = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useOutletContext: () => ({
    settingsHook: {
      language: "en",
      handleLanguageChange: mockHandleLanguageChange,
      loading: false,
    },
  }),
}));

// We'll mock the AuthContext completely and control its return value per test
const mockUpdateUser = jest.fn();
const mockRefreshCurrentUser = jest.fn();
let mockCurrentUser = null;

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    currentUser: mockCurrentUser,
    updateUser: mockUpdateUser,
    refreshCurrentUser: mockRefreshCurrentUser,
  }),
}));

const renderAccountSection = () => {
  render(
    <ToastProvider>
      <MemoryRouter>
        <AccountSection />
      </MemoryRouter>
    </ToastProvider>
  );
};

describe("<AccountSection />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser = {
      username: "TestUser",
      name: "Test Name",
      email: "test@example.com",
      subscriptionTier: "pro",
      credits: { current: 40, max: 50 },
      stripeCustomerId: "cus_12345",
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders correctly for a pro user with credits object", () => {
    renderAccountSection();
    expect(screen.getByDisplayValue("Test Name")).toBeInTheDocument();
    expect(screen.getByDisplayValue("test@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Navalingo Pro")).toBeInTheDocument();
    expect(screen.getByText("Manage Billing")).toBeInTheDocument();
    expect(screen.getByDisplayValue("40 / 50 credits remaining")).toBeInTheDocument();
  });

  it("handles null currentUser gracefully", () => {
    mockCurrentUser = null;
    renderAccountSection();
    expect(screen.getByDisplayValue("Loading…")).toBeInTheDocument();
  });

  it("handles deriving credits for a free user", () => {
    mockCurrentUser = {
      username: "FreeUser",
      email: "free@example.com",
      subscriptionTier: "free",
      creditsUsed: 2,
      // no `credits` object
    };
    renderAccountSection();
    expect(screen.getByDisplayValue("Navalingo Free")).toBeInTheDocument();
    expect(screen.getByDisplayValue("8 / 10 credits remaining")).toBeInTheDocument();
    expect(screen.getByText(/Your 7-day reset timer will begin/i)).toBeInTheDocument();
  });

  it("handles deriving credits with reset date in the past", () => {
    mockCurrentUser = {
      username: "ResetUser",
      subscriptionTier: "pro",
      creditsUsed: 20,
      creditResetDate: new Date(Date.now() - 100000).toISOString(),
    };
    renderAccountSection();
    expect(screen.getByDisplayValue("50 / 50 credits remaining")).toBeInTheDocument();
  });

  it("handles deriving credits with reset date in the future (days)", () => {
    mockCurrentUser = {
      username: "ResetUser",
      subscriptionTier: "pro",
      creditsUsed: 20,
      creditResetDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    };
    renderAccountSection();
    expect(screen.getByDisplayValue("30 / 50 credits remaining")).toBeInTheDocument();
    expect(screen.getByText(/Your credits reset in (1d 23h|2d)/i)).toBeInTheDocument();
  });

  it("handles profile name update successfully", async () => {
    const user = userEvent.setup();
    updateUserProfile.mockResolvedValueOnce({});
    renderAccountSection();

    const nameInput = screen.getByDisplayValue("Test Name");
    await user.clear(nameInput);
    await user.type(nameInput, "New Name");

    const updateButton = screen.getByRole("button", { name: "Update" });
    await user.click(updateButton);

    expect(updateUserProfile).toHaveBeenCalledWith({ name: "New Name" });
    expect(mockUpdateUser).toHaveBeenCalledWith(expect.objectContaining({ name: "New Name" }));
    
    await waitFor(() => {
      expect(screen.getByText("Profile updated successfully.")).toBeInTheDocument();
    });
  });

  it("handles profile name update error", async () => {
    const user = userEvent.setup();
    updateUserProfile.mockRejectedValueOnce({ response: { data: { error: "Update failed!" } } });
    renderAccountSection();

    const nameInput = screen.getByDisplayValue("Test Name");
    await user.clear(nameInput);
    await user.type(nameInput, "New Name2");

    const updateButton = screen.getByRole("button", { name: "Update" });
    await user.click(updateButton);

    await waitFor(() => {
      expect(screen.getByText("Update failed!")).toBeInTheDocument();
    });
  });

  it("handles billing portal redirection successfully", async () => {
    const user = userEvent.setup();
    const mockUrl = "https://billing.stripe.com/p/session/mock";
    api.post.mockResolvedValueOnce({ data: { url: mockUrl } });
    
    delete window.location;
    window.location = { href: "" };

    renderAccountSection();

    const billingButton = screen.getByText("Manage Billing");
    await user.click(billingButton);

    expect(api.post).toHaveBeenCalledWith("/stripe/create-portal-session");
    await waitFor(() => {
      expect(window.location.href).toBe(mockUrl);
    });
  });

  it("handles billing portal redirection error", async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    api.post.mockRejectedValueOnce(new Error("Stripe error"));
    
    renderAccountSection();

    const billingButton = screen.getByText("Manage Billing");
    await user.click(billingButton);

    await waitFor(() => {
      expect(screen.getByText("Could not open the billing portal. Please try again.")).toBeInTheDocument();
    });
    consoleSpy.mockRestore();
  });

  it("calls refreshCurrentUser on mount", async () => {
    renderAccountSection();
    await waitFor(() => {
      expect(mockRefreshCurrentUser).toHaveBeenCalled();
    });
  });
});
