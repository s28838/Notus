// src/components/settings/SettingRow.jsx
// A single row used for toggle settings (channel / category toggles).
import React from "react";
import ToggleSwitch from "../shared/ToggleSwitch";

const SettingRow = ({ id, icon, label, description, checked, onChange, last = false }) => (
  <div style={{
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    paddingBottom: last ? 0 : "0.875rem",
    marginBottom: last ? 0 : "0.875rem",
    borderBottom: last ? "none" : "1px solid var(--border-light)",
  }}>
    {icon && (
      <span className="material-symbols-outlined" style={{ color: "var(--text-secondary)", fontSize: "1.25rem", flexShrink: 0 }}>
        {icon}
      </span>
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ margin: 0, fontWeight: 600, fontSize: "0.875rem", color: "var(--text-primary)" }}>{label}</p>
      {description && (
        <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "var(--text-secondary)" }}>{description}</p>
      )}
    </div>
    <ToggleSwitch id={id} checked={checked} onChange={onChange} />
  </div>
);

export default SettingRow;
