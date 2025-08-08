//frontend/src/components/UI/Logo/Logo.jsx

import React from "react";
import styles from "./Logo.module.css";

function Logo({ size = "small", color = "default" }) {
  const textColorClass =
    color === "white" ? styles.whiteText : styles.defaultText;
  const sizeClass = styles[size] || styles.small;

  return (
    <div className={`${styles.logoContainer} ${sizeClass}`}>
      <svg preserveAspectRatio="xMidYMid meet" viewBox="0 0 400 70">
        <g transform="translate(0, 5)">
          <path
            d="M 25 55 L 25 5 L 65 55 L 65 5 L 55 15 M 65 5 L 75 15"
            className={styles.symbol}
            strokeWidth="12" /* MODIFIED: Increased from 10 to add visual weight */
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
        <text
          x="80"
          y="52"
          className={`${styles.wordmark} ${textColorClass}`}
          fontFamily="Segoe UI, Helvetica, Arial, sans-serif"
          fontSize="48"
          fontWeight="600"
        >
          avalingo
        </text>
      </svg>
    </div>
  );
}

export default Logo;
