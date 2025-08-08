// frontend/src/utils/auth/PasswordValidation.jsx

import React, { useState, useEffect } from "react";
// ✨ This import now points to its own dedicated stylesheet
import styles from "./PasswordValidation.module.css";

// --- Reusable Password Validation Hook ---
export const usePasswordValidation = (password) => {
  const [validation, setValidation] = useState({
    length: false,
    uppercase: false,
    number: false,
    specialChar: false,
  });

  useEffect(() => {
    setValidation({
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      specialChar: /[^A-Za-z0-9]/.test(password),
    });
  }, [password]);

  const isPasswordValid = Object.values(validation).every(Boolean);

  return { validation, isPasswordValid };
};

// --- Reusable Password Requirements Checklist Component ---
export const PasswordRequirements = ({ validation }) => {
  const requirements = [
    { key: "length", text: "At least 8 characters long" },
    { key: "uppercase", text: "At least one uppercase letter (A-Z)" },
    { key: "number", text: "At least one number (0-9)" },
    { key: "specialChar", text: "At least one special character (!, $, #, %)" },
  ];

  return (
    <ul className={styles.requirementsList}>
      {requirements.map((req) => (
        <li
          key={req.key}
          className={`${styles.requirementItem} ${
            validation[req.key] ? styles.valid : ""
          }`}
        >
          <span className={styles.icon}>
            {validation[req.key] ? "✔" : "✖"}
          </span>
          {req.text}
        </li>
      ))}
    </ul>
  );
};
