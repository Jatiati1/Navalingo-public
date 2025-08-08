// frontend/src/components/Account/Sidebar/Sidebar.jsx
import React from "react";
import { useLocation } from "react-router-dom";
import NavigationMenu from "../../UI/NavigationMenu/NavigationMenu.jsx";
import Tooltip from "../../UI/Tooltip/Tooltip.jsx";
import "./Sidebar.css";

/**
 * Sidebar
 * Fixed, icon-first navigation for Account sections.
 * Expects parent to supply onSidebarItemClick and user menu dropdown refs/handlers.
 */
const SIDEBAR_ITEMS = [
  {
    id: "account",
    label: "Account",
    icon: "https://img.icons8.com/ios-filled/50/currentColor/user-male-circle.png",
    alt: "Account",
    path: "/account",
  },
  {
    id: "security",
    label: "Security",
    icon: "https://img.icons8.com/ios-filled/50/currentColor/shield.png",
    alt: "Security",
    path: "/account/security",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: "https://img.icons8.com/ios-filled/50/currentColor/appointment-reminders.png",
    alt: "Notifications",
    path: "/account/notifications",
  },
  {
    id: "subscription",
    label: "Subscription",
    icon: "https://img.icons8.com/ios-filled/50/currentColor/us-dollar-circled.png",
    alt: "Subscription",
    path: "/account/subscription",
  },
  {
    id: "feedback",
    label: "Feedback",
    icon: "https://img.icons8.com/ios-filled/50/currentColor/comments.png",
    alt: "Feedback",
    path: "/account/feedback",
  },
  {
    id: "trash",
    label: "Trash",
    icon: "https://img.icons8.com/ios-filled/50/currentColor/trash.png",
    alt: "Trash",
    path: "/account/trash",
  },
];

function Sidebar({
  onSidebarItemClick,
  userMenuDropdown,
  accountUserMenuItems,
  className = "",
}) {
  const location = useLocation();

  // Active-state helper
  const isActive = (itemPath) => {
    if (itemPath === "/account") {
      return (
        location.pathname === "/account" || location.pathname === "/account/"
      );
    }
    return location.pathname.startsWith(itemPath);
  };

  return (
    <aside className={`main-sidebar ${className}`}>
      <nav className="sidebar-nav" aria-label="Account navigation">
        {SIDEBAR_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`sidebar-item ${isActive(item.path) ? "active" : ""}`}
            onClick={() => onSidebarItemClick(item)}
            aria-current={isActive(item.path) ? "page" : undefined}
          >
            <div className="sidebar-icon">
              <img src={item.icon} alt={item.alt} className="nav-icon" />
            </div>
            <span>{item.label}</span>
          </button>
        ))}

        {/* Try Pro */}
        <button
          type="button"
          className={`sidebar-item try-pro-item ${isActive("/account/try-pro") ? "active" : ""}`}
          onClick={() => onSidebarItemClick({ path: "/account/try-pro" })}
          aria-current={isActive("/account/try-pro") ? "page" : undefined}
        >
          <div className="sidebar-icon">
            <img
              src="https://img.icons8.com/ios-filled/50/FFFFFF/crown.png"
              alt="Upgrade to Pro"
              className="nav-icon"
            />
          </div>
          <span>Try&nbsp;Navalingo&nbsp;Pro</span>
        </button>
      </nav>

      <div className="menu-button-container">
        <Tooltip text="Menu" position="top">
          <button
            type="button"
            className="menuButton"
            onClick={userMenuDropdown.toggle}
            ref={userMenuDropdown.buttonRef}
            aria-label="User menu"
            aria-expanded={userMenuDropdown.isOpen}
            aria-controls="account-user-menu"
          >
            <img
              src="https://img.icons8.com/ios-filled/50/currentColor/menu--v1.png"
              alt="Menu"
              className="menuIcon"
            />
          </button>
        </Tooltip>

        <NavigationMenu
          id="account-user-menu"
          isOpen={userMenuDropdown.isOpen}
          dropdownRef={userMenuDropdown.dropdownRef}
          onClose={userMenuDropdown.close}
          menuItems={accountUserMenuItems}
          className="account-user-menu-position"
        />
      </div>
    </aside>
  );
}

export default Sidebar;
