// frontend/src/components/Auth/components/LoginForm/LoginForm.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { login } from "../../../../api/authService";
import { translateAuthError } from "../../../../utils/auth/authErrors";
import formStyles from "../Form.module.css";

/**
 * LoginForm
 * Minimal email/password auth form.
 * - Calls `login` on submit and forwards the user to `onSuccess`.
 * - Surfaces user-friendly errors via `setError`.
 * - Uses `setLoading` to reflect async state in the parent.
 */
export default function LoginForm({
  loading = false,
  setLoading,
  setError,
  onSuccess,
  className = "",
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const { user } = await login(email.trim(), password);
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
          type="email"
          placeholder="Email"
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
          autoComplete="current-password"
          required
          disabled={loading}
        />
      </div>

      <div className={formStyles.linkContainer}>
        <Link to="/recover-password" className={formStyles.link}>
          Forgot Password?
        </Link>
      </div>

      <div className={formStyles.fieldBtn}>
        <div className={formStyles.btnLayer} />
        <input
          type="submit"
          value={loading ? "Logging in…" : "Login"}
          disabled={loading}
        />
      </div>
    </form>
  );
}

LoginForm.propTypes = {
  loading: PropTypes.bool,
  setLoading: PropTypes.func.isRequired,
  setError: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  className: PropTypes.string,
};
