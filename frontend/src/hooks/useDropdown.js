// src/hooks/useDropdown.js

import { useState, useRef, useEffect } from "react";

/**
 * Custom hook for managing dropdown state and outside-click dismissal.
 *
 * Usage:
 * const { isOpen, toggle, open, close, buttonRef, dropdownRef } = useDropdown();
 * <button ref={buttonRef} onClick={toggle} aria-expanded={isOpen}>Menu</button>
 * {isOpen && <div ref={dropdownRef} role="menu">...</div>}
 *
 * @param {boolean} initialState - Initial open state of the dropdown.
 * @returns {Object} Dropdown state and handlers.
 * @returns {boolean} return.isOpen
 * @returns {() => void} return.toggle
 * @returns {() => void} return.open
 * @returns {() => void} return.close
 * @returns {import('react').RefObject<HTMLElement>} return.buttonRef
 * @returns {import('react').RefObject<HTMLElement>} return.dropdownRef
 */
export default function useDropdown(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  const toggle = () => setIsOpen(!isOpen);
  const close = () => setIsOpen(false);
  const open = () => setIsOpen(true);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        !dropdownRef.current?.contains(e.target) &&
        !buttonRef.current?.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return {
    isOpen,
    toggle,
    close,
    open,
    buttonRef,
    dropdownRef,
  };
}
