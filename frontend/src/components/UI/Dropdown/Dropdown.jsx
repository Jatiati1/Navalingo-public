// src/components/UI/Dropdown/Dropdown.jsx

import React, { forwardRef } from "react";
import styles from "./Dropdown.module.css";

/**
 * Dropdown container that stops click bubbling
 * and forces direct <button> children to type="button".
 */
const Dropdown = forwardRef(function Dropdown(
  { children, className = "", style = {}, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={`${styles.dropdown} ${className}`}
      style={style}
      onMouseDown={(e) => e.preventDefault()} // keep focus so click fires before close
      {...props}
    >
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;

        // Normalize any button-like child for safe behavior
        if (child.type === "button" || child.props?.onClick) {
          return React.cloneElement(child, {
            type: "button",
            onClick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              child.props.onClick?.(e);
            },
          });
        }

        return child;
      })}
    </div>
  );
});

Dropdown.displayName = "Dropdown";

export default Dropdown;
