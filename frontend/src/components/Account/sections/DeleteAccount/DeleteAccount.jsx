// frontend/src/pages/Account/sections/DeleteAccount/DeleteAccount.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../../context/AuthContext.jsx";
import { deleteAccount } from "../../../../api/userService.js";
import styles from "./DeleteAccount.module.css";

/**
 * DeleteAccount
 * Confirms account deletion, calls backend, then clears client auth state.
 */
export default function DeleteAccount() {
  const { currentUser, clearClientAuth } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConfirmDelete = async () => {
    setLoading(true);
    setError("");
    try {
      await deleteAccount();
      // Clear client state and route away (AuthContext handles redirection)
      clearClientAuth();
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to delete account. Please try again later."
      );
      setLoading(false);
    }
  };

  return (
    <div className={styles.deletePage}>
      <div className={styles.deleteContainer}>
        <h2 className={styles.title}>
          Are you sure you wish to delete the account?
        </h2>
        <p className={styles.warningText}>
          This action is permanent and cannot be undone. All your documents and
          personal data will be erased forever.
        </p>
        <div className={styles.emailDisplay}>
          Account: <strong>{currentUser?.email}</strong>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className={styles.buttonGroup}>
          <button
            className="button-secondary"
            onClick={() => navigate("/account/security")}
            disabled={loading}
          >
            No, take me back
          </button>
          <button
            className="button-danger"
            onClick={handleConfirmDelete}
            disabled={loading}
          >
            {loading ? "Deleting..." : "Yes, permanently delete my account"}
          </button>
        </div>
      </div>
    </div>
  );
}
