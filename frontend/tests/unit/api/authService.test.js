// tests/api/authService.test.js
import {
  login,
  signup,
  googleSignIn,
  logout,
  getUserProfile,
  forceLogout,
  validatePhone,
} from "@/api/authService";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "@/firebaseConfig";
import api, { fetchCsrfToken, setSessionToken } from "@/api/axios";

jest.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
}));

jest.mock("@/firebaseConfig", () => ({
  auth: {
    signOut: jest.fn(),
  },
}));

jest.mock("@/api/axios", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
  },
  fetchCsrfToken: jest.fn(),
  setSessionToken: jest.fn(),
}));

describe("AuthService", () => {
  const email = "test@example.com";
  const password = "password123";
  const username = "TestUser";
  const mockFirebaseUser = {
    uid: "firebase-uid",
    getIdToken: jest.fn().mockResolvedValue("mock-id-token"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    api.post.mockResolvedValue({ data: { success: true } });
    api.get.mockResolvedValue({ data: { username: "TestUser" } });
  });

  describe("login", () => {
    it("should login successfully", async () => {
      signInWithEmailAndPassword.mockResolvedValue({ user: mockFirebaseUser });

      const result = await login(email, password);

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, email, password);
      expect(mockFirebaseUser.getIdToken).toHaveBeenCalled();
      expect(api.post).toHaveBeenCalledWith("/auth/login", { idToken: "mock-id-token" });
      expect(fetchCsrfToken).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it("should store session token when response contains token", async () => {
      signInWithEmailAndPassword.mockResolvedValue({ user: mockFirebaseUser });
      api.post.mockResolvedValue({ data: { success: true, token: "session-token-123" } });

      const result = await login(email, password);

      expect(setSessionToken).toHaveBeenCalledWith("session-token-123");
      expect(result).toEqual({ success: true, token: "session-token-123" });
    });

    it("should throw error if Firebase signInWithEmailAndPassword fails", async () => {
      const firebaseError = new Error("Firebase auth error");
      signInWithEmailAndPassword.mockRejectedValue(firebaseError);

      await expect(login(email, password)).rejects.toThrow(firebaseError);
      expect(api.post).not.toHaveBeenCalled();
    });

    it("should throw error if API call /auth/login fails", async () => {
      signInWithEmailAndPassword.mockResolvedValue({ user: mockFirebaseUser });
      const apiError = new Error("API /auth/login error");
      api.post.mockRejectedValue(apiError);

      await expect(login(email, password)).rejects.toThrow(apiError);
    });
  });

  describe("signup", () => {
    it("should signup successfully", async () => {
      createUserWithEmailAndPassword.mockResolvedValue({ user: mockFirebaseUser });

      const result = await signup(email, password, username);

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, email, password);
      expect(mockFirebaseUser.getIdToken).toHaveBeenCalled();
      expect(api.post).toHaveBeenCalledWith("/auth/signup", {
        idToken: "mock-id-token",
        username,
        email,
      });
      expect(fetchCsrfToken).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe("googleSignIn", () => {
    it("should googleSignIn successfully", async () => {
      const result = await googleSignIn("google-id-token");

      expect(api.post).toHaveBeenCalledWith("/auth/google-signin", { idToken: "google-id-token" });
      expect(fetchCsrfToken).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });
  });

  describe("logout", () => {
    it("should logout successfully", async () => {
      await logout();

      expect(api.post).toHaveBeenCalledWith("/auth/logout");
      expect(setSessionToken).toHaveBeenCalledWith(null);
      expect(auth.signOut).toHaveBeenCalled();
    });
  });

  describe("getUserProfile", () => {
    it("should fetch user profile", async () => {
      const result = await getUserProfile();
      expect(api.get).toHaveBeenCalledWith("/users/profile");
      expect(result).toEqual({ username: "TestUser" });
    });
  });

  describe("validatePhone", () => {
    it("should validate phone", async () => {
      api.post.mockResolvedValue({ data: { valid: true } });
      const result = await validatePhone("1234567890");
      expect(api.post).toHaveBeenCalledWith("/auth/check-phone", {
        phoneNumber: "1234567890",
        type: "recovery",
      });
      expect(result).toEqual({ valid: true });
    });
  });
});
