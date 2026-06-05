import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReauthenticateModal from "@/features/security/ReauthenticateModal";
import { auth } from "@/firebaseConfig";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  reauthenticateWithPopup,
} from "firebase/auth";

jest.mock("@/firebaseConfig", () => ({
  auth: {
    currentUser: null,
  },
}));

jest.mock("firebase/auth", () => ({
  EmailAuthProvider: {
    credential: jest.fn(),
  },
  GoogleAuthProvider: jest.fn(),
  reauthenticateWithCredential: jest.fn(),
  reauthenticateWithPopup: jest.fn(),
}));

describe("ReauthenticateModal", () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();
  const mockOnForgotPassword = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing if no user is present", () => {
    auth.currentUser = null;
    const { container } = render(
      <ReauthenticateModal
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        onForgotPassword={mockOnForgotPassword}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  describe("Password User", () => {
    beforeEach(() => {
      auth.currentUser = {
        email: "test@example.com",
        providerData: [{ providerId: "password" }],
      };
    });

    it("renders password form correctly", () => {
      render(
        <ReauthenticateModal
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
          onForgotPassword={mockOnForgotPassword}
        />
      );

      expect(screen.getByRole("heading", { name: /confirm it’s you/i })).toBeInTheDocument();
      expect(screen.getByText(/confirm your password/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /forgot password\?/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /confirm/i })).toBeDisabled();
    });

    it("calls onSuccess upon successful password reauthentication", async () => {
      const user = userEvent.setup();
      reauthenticateWithCredential.mockResolvedValueOnce({});
      EmailAuthProvider.credential.mockReturnValueOnce("mock-cred");

      render(
        <ReauthenticateModal
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const input = screen.getByPlaceholderText("Enter your password");
      await user.type(input, "mysecretpassword");

      const submitBtn = screen.getByRole("button", { name: /confirm/i });
      await user.click(submitBtn);

      expect(EmailAuthProvider.credential).toHaveBeenCalledWith("test@example.com", "mysecretpassword");
      expect(reauthenticateWithCredential).toHaveBeenCalledWith(auth.currentUser, "mock-cred");
      
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it("displays error upon failed password reauthentication", async () => {
      const user = userEvent.setup();
      reauthenticateWithCredential.mockRejectedValueOnce(new Error("auth/wrong-password"));

      render(
        <ReauthenticateModal
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const input = screen.getByPlaceholderText("Enter your password");
      await user.type(input, "wrongpass");

      const submitBtn = screen.getByRole("button", { name: /confirm/i });
      await user.click(submitBtn);

      expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect password. Please try again.");
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("calls onForgotPassword", async () => {
      const user = userEvent.setup();
      render(
        <ReauthenticateModal
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
          onForgotPassword={mockOnForgotPassword}
        />
      );

      await user.click(screen.getByRole("button", { name: /forgot password\?/i }));
      expect(mockOnForgotPassword).toHaveBeenCalledTimes(1);
    });
  });

  describe("Google User", () => {
    beforeEach(() => {
      auth.currentUser = {
        email: "test@example.com",
        providerData: [{ providerId: "google.com" }],
      };
    });

    it("renders google form correctly", () => {
      render(
        <ReauthenticateModal
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(/signing in with google again/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
    });

    it("calls onSuccess upon successful Google reauthentication", async () => {
      const user = userEvent.setup();
      reauthenticateWithPopup.mockResolvedValueOnce({});

      render(
        <ReauthenticateModal
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const googleBtn = screen.getByRole("button", { name: /continue with google/i });
      await user.click(googleBtn);

      expect(GoogleAuthProvider).toHaveBeenCalled();
      expect(reauthenticateWithPopup).toHaveBeenCalled();

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledTimes(1);
      });
    });

    it("displays error upon failed Google reauthentication", async () => {
      const user = userEvent.setup();
      reauthenticateWithPopup.mockRejectedValueOnce(new Error("auth/popup-closed"));

      render(
        <ReauthenticateModal
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      );

      const googleBtn = screen.getByRole("button", { name: /continue with google/i });
      await user.click(googleBtn);

      expect(await screen.findByRole("alert")).toHaveTextContent("Failed to re-authenticate with Google. Please try again.");
    });
  });

  it("handles Escape key to cancel", async () => {
    const user = userEvent.setup();
    auth.currentUser = { email: "test@example.com", providerData: [] };
    
    render(
      <ReauthenticateModal
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
      />
    );

    await user.keyboard("{Escape}");
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });
});
