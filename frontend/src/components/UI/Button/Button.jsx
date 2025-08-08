/* frontend/src/components/UI/Button/Button.module.css */

/* Base button styles */
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.4;
  cursor: pointer;
  white-space: nowrap;
  text-decoration: none;
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

/* Disabled state */
.button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Keyboard focus style */
.button:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(40, 69, 113, 0.3);
}

/* Icon inside button */
.icon {
  margin-right: 8px;
  display: flex;
  align-items: center;
}

.icon svg {
  width: 18px;
  height: 18px;
}

/* Optional circular icon background */
.icon > .icon-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 24px;
  height: 24px;
}

.icon > .icon-circle svg {
  width: 14px;
  height: 14px;
}

/* Primary variant */
.primary {
  background-color: #284571;
  color: #ffffff;
  border-color: #284571;
}

.primary:hover:not(:disabled) {
  background-color: #1d355e;
  border-color: #1d355e;
}

/* Secondary variant */
.secondary {
  background-color: #f1f3f4;
  color: #3c4043;
  border-color: #dadce0;
}

.secondary:hover:not(:disabled) {
  background-color: #e8eaed;
}
