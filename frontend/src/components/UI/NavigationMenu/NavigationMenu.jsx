/* frontend/src/components/UI/NavigationMenu/NavigationMenu.jsx */

import React from "react";
import { useNavigate } from "react-router-dom";
import Dropdown from "../Dropdown/Dropdown";
import styles from "./NavigationMenu.module.css";

/**
 * Renders a menu item icon from a provided iconProp.
 * - Accepts a string URL for <img> icons.
 * - Accepts a React element (e.g., inline SVG).
 * - Falls back to a default icon by item ID if none provided.
 */
const RenderIcon = ({ iconProp, itemId, altText = "" }) => {
  if (typeof iconProp === "string" && iconProp.trim() !== "") {
    return <img src={iconProp} alt={altText} className={styles.iconImage} />;
  }
  if (React.isValidElement(iconProp)) {
    return React.cloneElement(iconProp, {
      className: `${styles.iconSvgFromProp} ${iconProp.props.className || ""}`,
      width: iconProp.props.width || "20",
      height: iconProp.props.height || "20",
    });
  }
  const DefaultIconComponent = defaultIconsById[itemId];
  return DefaultIconComponent ? <DefaultIconComponent /> : null;
};

/**
 * Default icons rendered as inline SVG for styling via CSS modules.
 */
const defaultIconsById = {
  home: () => (
    <svg className={styles.iconSvg} viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
      <path d="M9 22V12h6v10"></path>
    </svg>
  ),
  homenav: () => (
    <svg className={styles.iconSvg} viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
      <path d="M9 22V12h6v10"></path>
    </svg>
  ),
  account: () => (
    <svg className={styles.iconSvg} viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  account_nav: () => (
    <svg className={styles.iconSvg} viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  ),
  subscription: () => (
    <svg className={styles.iconSvg} viewBox="0 0 24 24">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"></path>
      <line x1="7" y1="7" x2="7.01" y2="7"></line>
    </svg>
  ),
  subscription_nav: () => (
    <svg className={styles.iconSvg} viewBox="0 0 24 24">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"></path>
      <line x1="7" y1="7" x2="7.01" y2="7"></line>
    </svg>
  ),
  support: () => (
    <svg className={styles.iconSvg} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10"></circle>
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"></path>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  ),
  feedback: () => (
    <svg className={styles.iconSvg} viewBox="0 0 24 24">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path>
    </svg>
  ),
  feedback_nav: () => (
    <svg className={styles.iconSvg} viewBox="0 0 24 24">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path>
    </svg>
  ),
  logout: () => (
    <svg
      className={`${styles.iconSvg} ${styles.logoutIconSvg}`}
      viewBox="0 0 24 24"
    >
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  ),
  logoutnav: () => (
    <svg
      className={`${styles.iconSvg} ${styles.logoutIconSvg}`}
      viewBox="0 0 24 24"
    >
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"></path>
      <polyline points="16 17 21 12 16 7"></polyline>
      <line x1="21" y1="12" x2="9" y2="12"></line>
    </svg>
  ),
};

/**
 * Renders the navigation menu dropdown with menu items and optional username.
 */
export default function NavigationMenu({
  isOpen,
  dropdownRef,
  onClose,
  username,
  menuItems = [],
  className = "",
  style = {},
  id = "navigation-menu-dropdown",
}) {
  const navigate = useNavigate();

  const handleItemClick = (item) => {
    if (typeof item.onClick === "function") {
      item.onClick();
    } else if (item.path) {
      navigate(item.path);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dropdown
      id={id}
      ref={dropdownRef}
      className={`${styles.navigationMenuBase} ${className}`}
      style={style}
    >
      {username && <div className={styles.usernameDisplay}>{username}</div>}
      {menuItems.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`${styles.menuItem} ${item.isLogout ? styles.logout : ""} ${
            item.className || ""
          }`}
          onClick={() => handleItemClick(item)}
          aria-label={item.label}
        >
          <span className={styles.icon}>
            <RenderIcon
              iconProp={item.icon}
              itemId={item.id}
              altText={item.label}
            />
          </span>
          <span>{item.label}</span>
        </button>
      ))}
    </Dropdown>
  );
}
