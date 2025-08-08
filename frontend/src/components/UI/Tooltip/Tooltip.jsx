// src/components/UI/Tooltip/Tooltip.jsx
import React, { useState } from "react";
import PropTypes from "prop-types";
import styles from "./Tooltip.module.css";

/**
 * Simple tooltip component.
 * Shows a text box when hovering over its child element.
 */
function Tooltip({ children, text, position = "top" }) {
  const [isVisible, setIsVisible] = useState(false);

  // Selects appropriate position style
  const positionClass =
    position === "bottom" ? styles.tooltipBottom : styles.tooltipTop;

  return (
    <div
      className={styles.tooltipContainer}
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}

      {/* Tooltip box appears only when hovered */}
      {isVisible && (
        <div className={`${styles.tooltipBox} ${positionClass}`}>{text}</div>
      )}
    </div>
  );
}

Tooltip.propTypes = {
  children: PropTypes.node.isRequired, // Element to hover over
  text: PropTypes.string.isRequired, // Tooltip text
  position: PropTypes.oneOf(["top", "bottom"]), // Tooltip position
};

export default Tooltip;
