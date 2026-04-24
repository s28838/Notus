// src/components/settings/SectionCard.jsx
// Reusable section container with a collapsible header used throughout the settings page.
import React, { useState } from "react";

const SectionCard = ({ icon, title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="interactive-card" style={{
      background: "var(--surface-light)",
      borderRadius: "1rem",
      border: "1px solid var(--border-light)",
      overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
    }}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "1rem",
          background: "none",
          border: "none",
          cursor: "pointer",
          borderBottom: open ? "1px solid var(--border-light)" : "none",
          transition: "border 0.2s",
        }}
      >
        <span className="material-symbols-outlined" style={{ color: "var(--color-primary)" }}>{icon}</span>
        <span style={{ flex: 1, textAlign: "left", fontWeight: 700, fontSize: "0.95rem", color: "var(--text-primary)" }}>
          {title}
        </span>
        <span className="material-symbols-outlined" style={{
          color: "var(--text-tertiary)",
          fontSize: "1.25rem",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.2s",
        }}>
          expand_more
        </span>
      </button>

      {/* Body */}
      <div style={{
        maxHeight: open ? "2000px" : "0",
        overflow: "hidden",
        transition: "max-height 0.35s ease",
      }}>
        <div style={{ padding: "1rem" }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default SectionCard;
