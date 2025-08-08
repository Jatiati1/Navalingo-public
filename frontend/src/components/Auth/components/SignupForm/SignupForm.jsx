// frontend/src/components/Auth/components/SignupForm/SignupForm.jsx
import React, { useState } from "react";
import PropTypes from "prop-types";
import { signup } from "../../../../api/authService";
import { translateAuthError } from "../../../../utils/auth/authErrors";
import formStyles from "../Form.module.css";
import {
  usePasswordValidation,
  PasswordRequirements,
} from "../../../../utils/auth/PasswordValidation";

const MAX_LEN = 128;

export default function SignupForm({
  loading = false,
  setLoading,
  setError,
  onSuccess,
  className = "",
}) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirm] = useState("");
  const [pwFocused, setPwFocus] = useState(false);

  const { validation, isPasswordValid } = usePasswordValidation(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!isPasswordValid) {
      setError("Password does not meet the requirements.");
      return;
    }

    setLoading(true);
    try {
      const { user } = await signup(email.trim(), password, username.trim());
      onSuccess(user);
    } catch (e) {
      setError(translateAuthError(e.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className={`${formStyles.form} ${className}`} onSubmit={handleSubmit}>
      <div className={formStyles.field}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
          disabled={loading}
        />
      </div>

      <div className={formStyles.field}>
        <input
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          disabled={loading}
        />
      </div>

      <div className={formStyles.field}>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onFocus={() => setPwFocus(true)}
          onBlur={() => setPwFocus(false)}
          autoComplete="new-password"
          required
          disabled={loading}
          maxLength={MAX_LEN}
        />
      </div>

      {pwFocused && <PasswordRequirements validation={validation} />}

      <div className={formStyles.field}>
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
          disabled={loading}
          maxLength={MAX_LEN}
        />
      </div>

      <div className={formStyles.fieldBtn}>
        <div className={formStyles.btnLayer} />
        <input
          type="submit"
          value={loading ? "Signing up…" : "Signup"}
          disabled={loading}
        />
      </div>
    </form>
  );
}

SignupForm.propTypes = {
  loading: PropTypes.bool,
  setLoading: PropTypes.func.isRequired,
  setError: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  className: PropTypes.string,
};
