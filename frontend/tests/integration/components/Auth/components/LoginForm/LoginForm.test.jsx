//frontend/tests/components/auth/LoginForm.test.jsx

/* ------------------------------------------------------------------ */
/* 1) Force every test to share ONE React instance                   */
/* ------------------------------------------------------------------ */
// jest.mock("react", () => jest.requireActual("react")); // This is often not needed unless specific issues arise

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

/* ------------------------------------------------------------------ */
/* 2) Single source-of-truth mock for the Auth API                   */
/* – declare it *before* any jest.mock() calls                    */
/* ------------------------------------------------------------------ */
const mockLogin = jest.fn((email) =>
  email === "error@x.com"
    ? Promise.reject(new Error("bad"))
    : Promise.resolve({ user: { uid: "u1" } }),
);

/* Point **both** possible import paths at the same factory (inline) */
jest.mock("@/api/authService", () => ({
  login: (...args) => mockLogin(...args), // Use the mockLogin defined above
}));
jest.mock("@/api/authService", () => ({
  login: (...args) => mockLogin(...args), // Use the mockLogin defined above
}));

/* ------------------------------------------------------------------ */
/* 3) NOW we can import the component under test                     */
/* ------------------------------------------------------------------ */
import LoginForm from "@/components/Auth/components/LoginForm/LoginForm";

/* ------------------------------------------------------------------ */
/* 4) Tiny CSS-module stub – always returns the requested key        */
/* ------------------------------------------------------------------ */
const css = new Proxy({}, { get: (_, k) => k });

/* ------------------------------------------------------------------ */
/* 5) Helper: fill the form and click the single <submit> button     */
/* ------------------------------------------------------------------ */
async function fillAndSubmit(email, password) {
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText(/email/i), email);
  await user.type(screen.getByPlaceholderText(/^password$/i), password);
  await user.click(screen.getByRole("button")); // first (and only) submit
}

/* ------------------------------------------------------------------ */
/* 6) Tests                                                          */
/* ------------------------------------------------------------------ */
afterEach(() => {
  jest.clearAllMocks(); // mockLogin is cleared here
});

describe("<LoginForm />", () => {
  it("happy path → calls login then onSuccess", async () => {
    const onSuccess = jest.fn();

    render(
      <MemoryRouter>
        <LoginForm
          styles={css}
          loading={false}
          setLoading={() => {}}
          setError={() => {}}
          onSuccess={onSuccess}
        />
      </MemoryRouter>,
    );

    await fillAndSubmit("a@b.com", "p1!");

    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith("a@b.com", "p1!"),
    );
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ uid: "u1" }));
  });

  it("propagates API error via setError", async () => {
    const setError = jest.fn();

    render(
      <MemoryRouter>
        <LoginForm
          styles={css}
          loading={false}
          setLoading={() => {}}
          setError={setError}
          onSuccess={() => {}}
        />
      </MemoryRouter>,
    );

    await fillAndSubmit("error@x.com", "nope");

    await waitFor(() => expect(setError).toHaveBeenCalledWith("An unexpected error occurred. Please try again."));
  });
});
