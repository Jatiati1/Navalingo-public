// tests/api/userService.test.js
import {
  getThemePreference,
  saveLanguagePreference,
  getLanguagePreference,
  updateUserProfile,
  getUserProfile,
  updateEmail,
  updatePassword,
  deleteAccount,
  linkPhoneNumber,
  updateUserPhoneNumber,
  devUpgradeToPro,
  devDowngradeToFree,
} from "@/api/userService";
import axiosInstance from "@/api/axios";

jest.mock("@/api/axios", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

describe("UserService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Theme Preferences", () => {
    it("getThemePreference should return 'light'", async () => {
      const result = await getThemePreference();
      expect(result).toBe("light");
    });
  });

  describe("Language Preferences", () => {
    it("should save language preference successfully", async () => {
      axiosInstance.put.mockResolvedValue({ data: { success: true } });
      const result = await saveLanguagePreference("es");
      expect(axiosInstance.put).toHaveBeenCalledWith("/users/preferences", { language: "es" });
      expect(result).toEqual({ success: true });
    });

    it("should get language preference successfully", async () => {
      axiosInstance.get.mockResolvedValue({ data: { preferences: { language: "fr" } } });
      const result = await getLanguagePreference();
      expect(axiosInstance.get).toHaveBeenCalledWith("/users/profile");
      expect(result).toBe("fr");
    });

    it("should fallback to 'en' if getLanguagePreference API fails", async () => {
      axiosInstance.get.mockRejectedValue(new Error("fail"));
      const result = await getLanguagePreference();
      expect(result).toBe("en");
    });
  });

  describe("User Profile", () => {
    it("should update user profile successfully", async () => {
      axiosInstance.put.mockResolvedValue({ data: { success: true } });
      const result = await updateUserProfile({ username: "NewName" });
      expect(axiosInstance.put).toHaveBeenCalledWith("/users/profile", { username: "NewName" });
      expect(result).toEqual({ success: true });
    });

    it("should get user profile successfully", async () => {
      axiosInstance.get.mockResolvedValue({ data: { username: "User" } });
      const result = await getUserProfile();
      expect(axiosInstance.get).toHaveBeenCalledWith("/users/profile");
      expect(result).toEqual({ username: "User" });
    });

    it("should return null if getUserProfile API fails", async () => {
      axiosInstance.get.mockRejectedValue(new Error("fail"));
      const result = await getUserProfile();
      expect(result).toBeNull();
    });
  });

  describe("Email, Password, Account", () => {
    it("updateEmail", async () => {
      axiosInstance.put.mockResolvedValue({ data: { ok: true } });
      await updateEmail("new@email.com");
      expect(axiosInstance.put).toHaveBeenCalledWith("/users/email", { newEmail: "new@email.com" });
    });

    it("updatePassword", async () => {
      axiosInstance.put.mockResolvedValue({ data: { ok: true } });
      await updatePassword("newpass");
      expect(axiosInstance.put).toHaveBeenCalledWith("/users/password", { newPassword: "newpass" });
    });

    it("deleteAccount", async () => {
      axiosInstance.delete.mockResolvedValue({ data: { ok: true } });
      await deleteAccount();
      expect(axiosInstance.delete).toHaveBeenCalledWith("/users");
    });
  });

  describe("Phone", () => {
    it("linkPhoneNumber", async () => {
      axiosInstance.post.mockResolvedValue({ data: { ok: true } });
      await linkPhoneNumber("token");
      expect(axiosInstance.post).toHaveBeenCalledWith("/user/phone/link", { idToken: "token" });
    });

    it("updateUserPhoneNumber", async () => {
      axiosInstance.put.mockResolvedValue({ data: { ok: true } });
      await updateUserPhoneNumber("123");
      expect(axiosInstance.put).toHaveBeenCalledWith("/user/phone", { newPhoneNumber: "123" });
    });
  });

  describe("Dev endpoints", () => {
    it("devUpgradeToPro", async () => {
      axiosInstance.post.mockResolvedValue({ data: { ok: true } });
      await devUpgradeToPro();
      expect(axiosInstance.post).toHaveBeenCalledWith("/users/dev-upgrade-to-pro");
    });
    it("devDowngradeToFree", async () => {
      axiosInstance.post.mockResolvedValue({ data: { ok: true } });
      await devDowngradeToFree();
      expect(axiosInstance.post).toHaveBeenCalledWith("/users/dev-downgrade-to-free");
    });
  });
});
