// src/components/shared/Toast.jsx
import React, { useEffect } from "react";

/**
 * Toast notification.
 * Props:
 *   message  – text to show
 *   type     – "success" | "error" | "info"
 *   onClose  – callback when hidden
 *   duration – ms before auto-hide (default 3000)
 */
const Toast = ({ message, type = "success", onClose, duration = 3000 }) => {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [message, duration, onClose]);

  if (!message) return null;

  const colours = {
    success: { bg: "#22c55e", icon: "check_circle" },
    error:   { bg: "#ef4444", icon: "error"         },
    info:    { bg: "var(--color-primary)", icon: "info" },
  };
  const { bg, icon } = colours[type] || colours.success;

  return (
    <div style={{
      position: "fixed",
      top: "1rem",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      maxWidth: "90vw",
      width: "360px",
      background: bg,
      color: "white",
      borderRadius: "1rem",
      padding: "0.85rem 1.25rem",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
      boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
      animation: "toastIn 0.25s ease-out",
      fontWeight: 600,
      fontSize: "0.9rem",
    }}>
      <span className="material-symbols-outlined" style={{ flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{
        background: "none", border: "none", color: "white",
        cursor: "pointer", padding: 0, display: "flex"
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: "1.1rem" }}>close</span>
      </button>

      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Toast;
