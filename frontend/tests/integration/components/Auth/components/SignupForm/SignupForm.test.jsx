// frontend/tests/components/auth/SignupForm.test.jsx

/* eslint-disable react/prop-types */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SignupForm from "@/components/Auth/components/SignupForm/SignupForm";

jest.mock("@/api/authService", () => ({ signup: jest.fn() }));
const { signup } = require("@/api/authService");

const css = new Proxy({}, { get: (_, k) => k });

const completeForm = async (user, over = {}) => {
  const data = {
    username: "bob",
    email: "b@c.com",
    phone: "123",
    pw: "Password123!",
    confirm: "Password123!",
    ...over,
  };

  await user.type(screen.getByPlaceholderText(/username/i), data.username);
  await user.type(screen.getByPlaceholderText(/email/i), data.email);
  await user.type(screen.getByPlaceholderText(/^password$/i), data.pw);
  await user.type(
    screen.getByPlaceholderText(/confirm password/i),
    data.confirm,
  );
  await user.click(screen.getByRole("button", { name: /signup/i }));
};

describe("<SignupForm>", () => {
  it("client-side password mismatch → setError", async () => {
    const user = userEvent.setup();
    const setError = jest.fn();

    render(
      <SignupForm
        loading={false}
        setLoading={() => {}}
        setError={setError}
        onSuccess={() => {}}
        styles={css}
      />,
    );

    await completeForm(user, { confirm: "oops" });
    await waitFor(() => expect(setError).toHaveBeenCalledWith("Passwords do not match."));
    expect(signup).not.toHaveBeenCalled();
  });

  it("calls signup and onSuccess", async () => {
    const user = userEvent.setup();
    signup.mockResolvedValue({ user: { uid: "x" } });
    const onSuccess = jest.fn();

    render(
      <SignupForm
        loading={false}
        setLoading={() => {}}
        setError={() => {}}
        onSuccess={onSuccess}
        styles={css}
      />,
    );

    await completeForm(user);
    await waitFor(() => expect(signup).toHaveBeenCalled());
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith({ uid: "x" }));
  });

  it("shows backend error via setError", async () => {
    const user = userEvent.setup();
    signup.mockRejectedValue(new Error("taken"));
    const setError = jest.fn();

    render(
      <SignupForm
        loading={false}
        setLoading={() => {}}
        setError={setError}
        onSuccess={() => {}}
        styles={css}
      />,
    );

    await completeForm(user);
    await waitFor(() => expect(setError).toHaveBeenCalledWith("An unexpected error occurred. Please try again."));
  });
});
