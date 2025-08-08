// src/components/UI/Footer/Footer.jsx

import styles from "./Footer.module.css";

function Footer({ className }) {
  // Combine default footer style with any additional class passed as prop
  const footerClasses = className
    ? `${styles.footer} ${styles[className] || className}`
    : styles.footer;

  return (
    <footer className={footerClasses}>
      <p>© 2025 LexiLingo, Inc. | Privacy | Terms</p>
    </footer>
  );
}

export default Footer;
