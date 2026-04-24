// src/components/shared/ToggleSwitch.jsx
import React from "react";

/**
 * Accessible toggle switch.
 * Props:
 *   checked  – boolean
 *   onChange – (newValue: boolean) => void
 *   id       – unique DOM id (for a11y)
 *   disabled – boolean
 */
const ToggleSwitch = ({ checked, onChange, id, disabled = false }) => (
  <button
    id={id}
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => !disabled && onChange(!checked)}
    style={{
      position: "relative",
      display: "inline-flex",
      alignItems: "center",
      width: "2.75rem",
      height: "1.5rem",
      borderRadius: "999px",
      border: "none",
      cursor: disabled ? "not-allowed" : "pointer",
      background: checked ? "var(--color-primary)" : "var(--border-light)",
      transition: "background 0.25s",
      flexShrink: 0,
      opacity: disabled ? 0.5 : 1,
      padding: 0,
    }}
  >
    <span style={{
      position: "absolute",
      left: checked ? "calc(100% - 1.25rem)" : "0.125rem",
      width: "1.25rem",
      height: "1.25rem",
      borderRadius: "50%",
      background: "white",
      boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
      transition: "left 0.25s",
    }} />
  </button>
);

export default ToggleSwitch;
