// frontend/src/components/UI/Button/Button.jsx
// Reusable button component with variant styling and optional icon support.

import React, { forwardRef } from "react";
import styles from "./Button.module.css";

/**
 * Button
 * A generic, accessible button component.
 *
 * Props:
 * - variant: "primary" | "secondary" | "iconButton" (styling presets)
 * - type: button type (default: "button" to prevent accidental form submits)
 * - icon: optional React node displayed before the label
 * - className: additional CSS classes
 * - disabled: boolean to disable the button
 * - onClick: click handler
 * - children: button label or content
 */
const Button = forwardRef(
  (
    {
      children,
      onClick,
      variant = "primary",
      disabled = false,
      className = "",
      type = "button",
      icon = null,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        className={`${styles.button} ${styles[variant]} ${className}`}
        onClick={onClick}
        disabled={disabled}
        {...props}
      >
        {icon && <span className={styles.icon}>{icon}</span>}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
