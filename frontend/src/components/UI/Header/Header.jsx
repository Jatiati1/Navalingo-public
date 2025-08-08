//src/components/UI/Header/Header.jsx
import React, { useCallback } from "react";
import PropTypes from "prop-types";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.jsx";
import { useDropdown, useNetworkStatus } from "../../../hooks";
import NavigationMenu from "../NavigationMenu/NavigationMenu.jsx";
import Logo from "../Logo/Logo.jsx";
import Tooltip from "../Tooltip/Tooltip.jsx";
import styles from "./Header.module.css";

/**
 * Dynamically builds the complete header menu based on the current page
 */
const getHeaderNavItems = (currentPath, onLogoutHandler) => {
  const allItems = [
    { id: "home", label: "Home", path: "/home" },
    {
      id: "account",
      label: "Account",
      path: "/account",
      check: (p) => p.startsWith("/account"),
    },
    {
      id: "subscription",
      label: "Subscription",
      path: "/account/subscription",
    },
    { id: "feedback", label: "Feedback", path: "/account/feedback" },
  ];

  // Filter out the link for the page the user is currently on
  const filteredItems = allItems.filter((item) => {
    if (item.check) return !item.check(currentPath);
    return item.path !== currentPath;
  });

  // Always add the logout option at the end
  filteredItems.push({
    id: "logout",
    label: "Sign out",
    isLogout: true,
    onClick: onLogoutHandler,
  });

  return filteredItems;
};

/**
 * Main application header
 */
function Header({ showMenu = true, className = "" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useAuth();
  const navMenuDropdown = useDropdown(false);
  const isOnline = useNetworkStatus();

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      navigate("/auth", { replace: true });
    } catch (err) {
      console.error("Logout error from Header:", err);
    }
  }, [logout, navigate]);

  const menuItemsForHeader = getHeaderNavItems(location.pathname, handleLogout);

  return (
    <header className={`${styles.header} ${className}`}>
      <div className={styles.leftSection}>
        {showMenu && currentUser && (
          <div className={styles.menuContainer}>
            <Tooltip text="Menu" position="bottom">
              <button
                type="button"
                className={styles.menuButton}
                onClick={navMenuDropdown.toggle}
                ref={navMenuDropdown.buttonRef}
                aria-label="Application Menu"
                aria-expanded={navMenuDropdown.isOpen}
                aria-controls="main-header-menu"
                disabled={!isOnline}
              >
                <svg className={styles.menuIcon} viewBox="0 0 24 24">
                  <path d="M3 12h18M3 6h18M3 18h18" />
                </svg>
              </button>
            </Tooltip>
            <NavigationMenu
              id="main-header-menu"
              isOpen={navMenuDropdown.isOpen}
              dropdownRef={navMenuDropdown.dropdownRef}
              onClose={navMenuDropdown.close}
              username={currentUser?.username}
              menuItems={menuItemsForHeader}
              className={styles.headerNavMenuPosition}
            />
          </div>
        )}
      </div>
      <div className={styles.centerSection}>
        <Logo size="small" color="white" />
      </div>
      <div className={styles.rightSection}>{/* Empty for balance */}</div>
    </header>
  );
}

Header.propTypes = {
  showMenu: PropTypes.bool,
  className: PropTypes.string,
};

export default Header;
