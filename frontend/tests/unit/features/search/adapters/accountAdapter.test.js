import { makeAccountAdapter } from "@/features/search/adapters/accountAdapter";

describe("accountAdapter", () => {
  const mockGetUser = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    delete window.location;
    window.location = { href: "" };
  });

  it("returns empty array for empty query", () => {
    const adapter = makeAccountAdapter(mockGetUser);
    expect(adapter.search("   ")).toEqual([]);
  });

  it("returns static page matches", () => {
    mockGetUser.mockReturnValue(null);
    const adapter = makeAccountAdapter(mockGetUser);

    const results = adapter.search("sec"); // Should match "Security"

    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "security",
          label: "Security",
          section: "Profile & Identity",
        }),
      ])
    );

    // Test action
    const securityMatch = results.find((r) => r.id === "security");
    securityMatch.action();
    expect(window.location.href).toBe("/account/security");
  });

  it("includes dynamic email item if user has email", () => {
    mockGetUser.mockReturnValue({ email: "test@example.com" });
    const adapter = makeAccountAdapter(mockGetUser);

    const results = adapter.search("email"); // Should match "Email address"

    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "email_field",
          label: "Email address",
          sub: "test@example.com",
        }),
      ])
    );
  });

  it("includes dynamic phone item if user has phone number", () => {
    mockGetUser.mockReturnValue({ phoneNumber: "+1234567890" });
    const adapter = makeAccountAdapter(mockGetUser);

    const results = adapter.search("phone");

    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "phone_field",
          label: "Phone number",
          sub: "+1234567890",
        }),
      ])
    );

    // action test
    const phoneMatch = results.find((r) => r.id === "phone_field");
    phoneMatch.action();
    expect(window.location.href).toBe("/account/security");
  });

  it("includes dynamic password item if user has password provider", () => {
    mockGetUser.mockReturnValue({
      providerData: [{ providerId: "password" }]
    });
    const adapter = makeAccountAdapter(mockGetUser);

    const results = adapter.search("pass");

    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "password_field",
          label: "Password",
          sub: "********",
        }),
      ])
    );
  });

  it("allows searching by substring in dynamic fields (e.g. searching email value)", () => {
    mockGetUser.mockReturnValue({ email: "joel@example.com" });
    const adapter = makeAccountAdapter(mockGetUser);

    // Search the actual email string
    const results = adapter.search("joel");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("email_field");
  });

  it("handles user being undefined or missing fields gracefully", () => {
    mockGetUser.mockReturnValue(undefined);
    const adapter = makeAccountAdapter(mockGetUser);

    const results = adapter.search("profile");
    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "profile" })
      ])
    );
  });
});
