import React, { useCallback, useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { apiGet } from "../../services/api";

const READ_NOTIFICATIONS_KEY = "notus_student_read_notifications";

const loadReadNotificationIds = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(READ_NOTIFICATIONS_KEY) || "[]"));
  } catch {
    return new Set();
  }
};

const StudentBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnread = useCallback(async () => {
    try {
      const response = await apiGet("/api/student/notifications");
      const readIds = loadReadNotificationIds();
      const notifications = Array.isArray(response.notifications) ? response.notifications : [];
      setUnreadCount(notifications.filter((item) => !item.read && !readIds.has(item.id)).length);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    loadUnread();
    const handleVisibility = () => {
      if (!document.hidden) loadUnread();
    };

    window.addEventListener("student-notifications:read", loadUnread);
    window.addEventListener("student-notifications:changed", loadUnread);
    window.addEventListener("focus", loadUnread);
    window.addEventListener("storage", loadUnread);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("student-notifications:read", loadUnread);
      window.removeEventListener("student-notifications:changed", loadUnread);
      window.removeEventListener("focus", loadUnread);
      window.removeEventListener("storage", loadUnread);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadUnread]);

  const navItems = [
    { label: "Główna", icon: "home", path: "/student" },
    { label: "Plan", icon: "calendar_month", path: "/student/schedule" },
    { label: "Grupy", icon: "groups", path: "/student/groups" },
    { label: "Aktywność", icon: "notifications", path: "/student/activity" },
    { label: "Profil", icon: "person", path: "/student/settings" },
  ];

  return (
    <nav className="bottom-nav-stitch">
      <div className="nav-main-items">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button key={item.path} className={`nav-item ${isActive ? "active" : ""}`} onClick={() => navigate(item.path)}>
              <span className="nav-icon-wrap">
                <span className={`material-symbols-outlined ${isActive ? "fill" : ""}`}>{item.icon}</span>
                {item.path === "/student/activity" && unreadCount > 0 && (
                  <span className="nav-notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
                )}
              </span>
              {item.label}
            </button>
          );
        })}
      </div>
      <button className="nav-item nav-logout" onClick={logout}>
        <span className="material-symbols-outlined">logout</span>
        Wyloguj
      </button>
    </nav>
  );
};

export default StudentBottomNav;
